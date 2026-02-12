from algopy import *
from algopy.arc4 import abimethod, Struct


class Group(Struct):
    id: UInt64
    name: String
    admin: Account


class Expense(Struct):
    id: UInt64
    group_id: UInt64
    name: String
    total_amount: UInt64  # in microalgos
    payer: Account
    participant_count: UInt64
    split_type: String  # 'equal', 'custom', 'percentage'
    status: String  # 'open', 'locked', 'paid'


class Balance(Struct):
    owed: UInt64
    paid: UInt64


class GroupExpense(ARC4Contract):
    group_count: UInt64
    expense_count: UInt64

    def __init__(self) -> None:
        """Initializes contract storages on deployment"""
        self.group_count = UInt64(0)
        self.expense_count = UInt64(0)
        self.groups = BoxMap(UInt64, Group, key_prefix="group")
        self.expenses = BoxMap(UInt64, Expense, key_prefix="expense")
        self.group_members = BoxMap(tuple[UInt64, UInt64], Account, key_prefix="group_members")  # (group_id, index) -> member
        self.expense_participants = BoxMap(tuple[UInt64, UInt64], Account, key_prefix="expense_participants")  # (expense_id, index) -> participant
        self.expense_amounts = BoxMap(tuple[UInt64, UInt64], UInt64, key_prefix="expense_amounts")  # (expense_id, index) -> owed amount
        self.owed = BoxMap(tuple[UInt64, Account], UInt64, key_prefix="owed")  # (expense_id, member) -> owed
        self.paid = BoxMap(tuple[UInt64, Account], UInt64, key_prefix="paid")  # (expense_id, member) -> paid

    @abimethod()
    def create_group(self, name: String, member1: Account, member2: Account, member3: Account) -> UInt64:
        """Creates a new group with up to 3 members. Caller becomes admin."""
        group_id = self.group_count
        self.group_count += 1
        group = Group(id=group_id, name=name, admin=Txn.sender)
        self.groups[group_id] = group
        self.group_members[(group_id, UInt64(0))] = member1
        self.group_members[(group_id, UInt64(1))] = member2
        self.group_members[(group_id, UInt64(2))] = member3
        return group_id

    @abimethod()
    def add_expense(
        self,
        group_id: UInt64,
        name: String,
        total_amount: UInt64,
        participant1: Account,
        participant2: Account,
        participant3: Account,
        split_type: String,
        amount1: UInt64,
        amount2: UInt64,
        amount3: UInt64,
        pay_txn: gtxn.PaymentTransaction
    ) -> UInt64:
        """Adds a pay-first expense. Payer must pay the total amount upfront."""
        group = self.groups[group_id]
        assert Txn.sender == group.admin, "Only group admin can add expense"
        assert pay_txn.sender == Txn.sender, "Payer must be the sender"
        assert pay_txn.receiver == Global.current_application_address, "Payment must be to contract"
        assert pay_txn.amount == total_amount, "Payment amount must match total"

        expense_id = self.expense_count
        self.expense_count += 1

        participants = [participant1, participant2, participant3]
        amounts = [amount1, amount2, amount3]

        # Calculate owed amounts
        owed_amounts = []
        if split_type == String("equal"):
            equal_share = total_amount // 3
            remainder = total_amount % 3
            for i in range(3):
                share = equal_share
                if i < remainder:
                    share += 1
                owed_amounts.append(share)
        elif split_type == String("custom"):
            total_custom = amount1 + amount2 + amount3
            assert total_custom == total_amount, "Custom amounts must sum to total"
            owed_amounts = [amount1, amount2, amount3]
        else:
            assert False, "Invalid split type"

        expense = Expense(
            id=expense_id,
            group_id=group_id,
            name=name,
            total_amount=total_amount,
            payer=Txn.sender,
            participant_count=UInt64(3),
            split_type=split_type,
            status=String("open")
        )
        self.expenses[expense_id] = expense

        # Store participants and amounts
        for i in range(3):
            self.expense_participants[(expense_id, UInt64(i))] = participants[i]
            self.expense_amounts[(expense_id, UInt64(i))] = owed_amounts[i]
            member = participants[i]
            owed = owed_amounts[i]
            self.owed[(expense_id, member)] = owed
            self.paid[(expense_id, member)] = UInt64(0)

        return expense_id

    @abimethod()
    def pay_share(self, expense_id: UInt64, pay_txn: gtxn.PaymentTransaction) -> None:
        """Member pays their share."""
        expense = self.expenses[expense_id]
        assert expense.status == String("open"), "Expense not open for payments"
        # Check if sender is participant
        is_participant = False
        for i in range(expense.participant_count):
            if self.expense_participants[(expense_id, UInt64(i))] == pay_txn.sender:
                is_participant = True
                break
        assert is_participant, "Sender not a participant"
        assert pay_txn.receiver == Global.current_application_address, "Payment must be to contract"

        owed, _ = self.owed.maybe((expense_id, pay_txn.sender))
        paid, _ = self.paid.maybe((expense_id, pay_txn.sender))
        if not _:
            paid = UInt64(0)
        assert paid < owed, "Already paid full share"
        remaining = owed - paid
        assert pay_txn.amount <= remaining, "Overpayment not allowed"

        self.paid[(expense_id, pay_txn.sender)] = paid + pay_txn.amount

        # Check if all paid
        all_paid = True
        for i in range(expense.participant_count):
            participant = self.expense_participants[(expense_id, UInt64(i))]
            p, _ = self.paid.maybe((expense_id, participant))
            o, _ = self.owed.maybe((expense_id, participant))
            if p < o:
                all_paid = False
                break
        if all_paid:
            expense.status = String("paid")
            self.expenses[expense_id] = expense

    @abimethod()
    def release_funds(self, expense_id: UInt64) -> None:
        """Release funds to payer once all paid."""
        expense = self.expenses[expense_id]
        assert expense.status == String("paid"), "Expense not fully paid"
        assert Txn.sender == expense.payer, "Only payer can release"

        total_collected = UInt64(0)
        for i in range(expense.participant_count):
            participant = self.expense_participants[(expense_id, UInt64(i))]
            p, _ = self.paid.maybe((expense_id, participant))
            total_collected += p

        itxn.Payment(receiver=expense.payer, amount=total_collected, fee=0).submit()

        expense.status = String("released")
        self.expenses[expense_id] = expense

    @abimethod()
    def cancel_expense(self, expense_id: UInt64) -> None:
        """Cancel expense and refund all (admin only)."""
        expense = self.expenses[expense_id]
        group = self.groups[expense.group_id]
        assert Txn.sender == group.admin, "Only group admin can cancel"
        assert expense.status == String("open"), "Cannot cancel locked or paid expense"

        # Refund payer
        itxn.Payment(receiver=expense.payer, amount=expense.total_amount, fee=0).submit()

        # Refund members who paid
        for i in range(expense.participant_count):
            participant = self.expense_participants[(expense_id, UInt64(i))]
            p, _ = self.paid.maybe((expense_id, participant))
            if p > 0:
                itxn.Payment(receiver=participant, amount=p, fee=0).submit()

        expense.status = String("cancelled")
        self.expenses[expense_id] = expense

    @abimethod(readonly=True)
    def get_expense(self, expense_id: UInt64) -> Expense:
        """Get expense details."""
        return self.expenses[expense_id]

    @abimethod(readonly=True)
    def get_group(self, group_id: UInt64) -> Group:
        """Get group details."""
        return self.groups[group_id]

    @abimethod(readonly=True)
    def get_owed(self, expense_id: UInt64, member: Account) -> UInt64:
        """Get owed amount for a member in an expense."""
        owed, _ = self.owed.maybe((expense_id, member))
        return owed

    @abimethod(readonly=True)
    def get_paid(self, expense_id: UInt64, member: Account) -> UInt64:
        """Get paid amount for a member in an expense."""
        paid, _ = self.paid.maybe((expense_id, member))
        return paid
