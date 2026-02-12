from algopy import *
from algopy.arc4 import abimethod


class Sponsorship(ARC4Contract):
    club_admin: Account
    purpose_count: UInt64

    def __init__(self) -> None:
        """Initializes contract storages on deployment"""
        self.club_admin = Txn.sender
        self.purpose_count = UInt64(0)
        self.purpose_names = BoxMap(UInt64, String, key_prefix="name")
        self.purpose_targets = BoxMap(UInt64, UInt64, key_prefix="target")
        self.purpose_funded_amounts = BoxMap(UInt64, UInt64, key_prefix="funded")
        self.purpose_sponsors = BoxMap(UInt64, Account, key_prefix="sponsor")
        self.purpose_proof_hashes = BoxMap(UInt64, String, key_prefix="proof")
        self.purpose_statuses = BoxMap(UInt64, String, key_prefix="status")

    @abimethod()
    def createPurpose(self, name: String, target: UInt64) -> UInt64:
        """Creates a new purpose campaign (Club Admin only)"""
        assert Txn.sender == self.club_admin, "Only club admin can create purpose"
        purpose_id = self.purpose_count
        self.purpose_count += 1
        self.purpose_names[purpose_id] = name
        self.purpose_targets[purpose_id] = target
        self.purpose_funded_amounts[purpose_id] = UInt64(0)
        self.purpose_sponsors[purpose_id] = Account()
        self.purpose_proof_hashes[purpose_id] = String("")
        self.purpose_statuses[purpose_id] = String("open")
        return purpose_id

    @abimethod()
    def fund_purpose(self, purpose_id: UInt64, pay_txn: gtxn.PaymentTransaction) -> None:
        """Funds a purpose (Sponsor)"""
        status = self.purpose_statuses[purpose_id]
        assert status == String("open"), "Purpose not open for funding"
        assert pay_txn.receiver == Global.current_application_address, "Payment must be to app address"
        assert pay_txn.amount > 0, "Amount must be positive"
        funded = self.purpose_funded_amounts[purpose_id]
        funded += pay_txn.amount
        self.purpose_funded_amounts[purpose_id] = funded
        self.purpose_sponsors[purpose_id] = pay_txn.sender
        if funded >= self.purpose_targets[purpose_id]:
            self.purpose_statuses[purpose_id] = String("funded")

    @abimethod()
    def submit_proof(self, purpose_id: UInt64, proof_hash: String) -> None:
        """Submits proof for a purpose (Club Admin only)"""
        assert Txn.sender == self.club_admin, "Only club admin can submit proof"
        status = self.purpose_statuses[purpose_id]
        assert status == String("funded"), "Purpose not funded"
        self.purpose_proof_hashes[purpose_id] = proof_hash
        self.purpose_statuses[purpose_id] = String("proved")

    @abimethod()
    def release_funds(self, purpose_id: UInt64, receiver: Account) -> None:
        """Releases funds to receiver (Sponsor or Admin)"""
        status = self.purpose_statuses[purpose_id]
        assert status == String("proved"), "Proof not submitted"
        sponsor = self.purpose_sponsors[purpose_id]
        assert Txn.sender == sponsor or Txn.sender == self.club_admin, "Only sponsor or admin can release"
        amount = self.purpose_funded_amounts[purpose_id]
        itxn.Payment(receiver=receiver, amount=amount, fee=0).submit()
        self.purpose_statuses[purpose_id] = String("released")

    @abimethod(readonly=True)
    def get_purpose(self, purpose_id: UInt64) -> tuple[String, UInt64, UInt64, Account, String, String]:
        """Returns purpose details including proof"""
        return (
            self.purpose_names[purpose_id],
            self.purpose_targets[purpose_id],
            self.purpose_funded_amounts[purpose_id],
            self.purpose_sponsors[purpose_id],
            self.purpose_proof_hashes[purpose_id],  # ← Proof can be viewed here
            self.purpose_statuses[purpose_id]
        )

    @abimethod(readonly=True)
    def get_purpose_count(self) -> UInt64:
        """Returns the total number of purposes created"""
        return self.purpose_count
