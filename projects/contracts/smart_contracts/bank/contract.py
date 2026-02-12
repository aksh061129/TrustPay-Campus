from algopy import *
from algopy.arc4 import abimethod
from algopy import TransactionType


class Bank(ARC4Contract):
    total_deposit: UInt64

    def __init__(self) -> None:
        """Initializes contract storages on deployment"""
        self.deposits = BoxMap(Account, UInt64, key_prefix="")
        self.total_deposit = UInt64(0)

    @abimethod()
    def deposit(self, memo: String, pay_txn_index: UInt64) -> UInt64:
        """Accepts a payment into the app escrow and records sender's deposited balance"""
        payment = gtxn[pay_txn_index]  # type: ignore
        assert payment.type_enum == TransactionType.Payment, "Transaction must be a payment"  # type: ignore
        assert payment.receiver == Global.current_application_address, "Receiver must be the contract address"  # type: ignore
        assert payment.amount > 0, "Deposit amount must be greater than zero"  # type: ignore

        amount, exists = self.deposits.maybe(payment.sender)  # type: ignore
        if exists:
            self.deposits[payment.sender] = amount + payment.amount  # type: ignore
        else:
            self.deposits[payment.sender] = payment.amount  # type: ignore

        self.total_deposit += payment.amount  # type: ignore
        return self.deposits[payment.sender]  # type: ignore

    @abimethod()
    def withdraw(self, amount: UInt64) -> UInt64:
        """Sends ALGO back to the caller from their recorded balance"""
        current, exists = self.deposits.maybe(Txn.sender)
        assert exists, "No deposits found for this account"
        assert amount > 0, "Withdrawal amount must be greater than zero"
        assert amount <= current, "Withdrawal amount exceeds balance"

        itxn.Payment(receiver=Txn.sender, amount=amount, fee=0).submit()

        remaining = current - amount
        if remaining == UInt64(0):
            del self.deposits[Txn.sender]
        else:
            self.deposits[Txn.sender] = remaining

        return remaining


