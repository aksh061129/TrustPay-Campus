import pyteal as pt

# Global state keys
club_admin_key = pt.Bytes("club_admin")
purpose_id_key = pt.Bytes("purpose_id")
purpose_name_key = pt.Bytes("purpose_name")
target_amount_key = pt.Bytes("target_amount")
status_key = pt.Bytes("status")  # 0=CREATED, 1=FUNDED, 2=PROOF_SUBMITTED, 3=RELEASED
sponsor_key = pt.Bytes("sponsor")
funded_amount_key = pt.Bytes("funded_amount")
proof_hash_key = pt.Bytes("proof_hash")

# Status constants
STATUS_CREATED = pt.Int(0)
STATUS_FUNDED = pt.Int(1)
STATUS_PROOF_SUBMITTED = pt.Int(2)
STATUS_RELEASED = pt.Int(3)

# On application creation
@pt.Subroutine(pt.TealType.none)
def on_create():
    return pt.Seq([
        pt.App.globalPut(club_admin_key, pt.Txn.sender()),
        pt.App.globalPut(purpose_id_key, pt.Int(0)),
        pt.App.globalPut(status_key, STATUS_CREATED)
    ])

# Create purpose (Club Admin only)
@pt.Subroutine(pt.TealType.none)
def create_purpose():
    name = pt.Txn.application_args[1]
    target = pt.Btoi(pt.Txn.application_args[2])
    current_status = pt.App.globalGet(status_key)
    return pt.Seq([
        pt.Assert(pt.Txn.sender() == pt.App.globalGet(club_admin_key)),
        pt.Assert(pt.Or(current_status == STATUS_CREATED, current_status == STATUS_RELEASED)),
        pt.App.globalPut(purpose_name_key, name),
        pt.App.globalPut(target_amount_key, target),
        pt.App.globalPut(status_key, STATUS_CREATED),
        pt.App.globalPut(purpose_id_key, pt.App.globalGet(purpose_id_key) + pt.Int(1))
    ])

# Fund purpose (Sponsor with payment transaction)
@pt.Subroutine(pt.TealType.none)
def fund_purpose():
    payment_txn = pt.Gtxn[pt.Txn.group_index() + pt.Int(1)]
    return pt.Seq([
        pt.Assert(pt.App.globalGet(status_key) == STATUS_CREATED),
        pt.Assert(payment_txn.type_enum() == pt.TxnType.Payment),
        pt.Assert(payment_txn.receiver() == pt.Global.current_application_address()),
        pt.Assert(payment_txn.amount() >= pt.App.globalGet(target_amount_key)),
        pt.App.globalPut(sponsor_key, payment_txn.sender()),
        pt.App.globalPut(funded_amount_key, payment_txn.amount()),
        pt.App.globalPut(status_key, STATUS_FUNDED)
    ])

# Submit proof (Club Admin only)
@pt.Subroutine(pt.TealType.none)
def submit_proof():
    proof = pt.Txn.application_args[1]
    return pt.Seq([
        pt.Assert(pt.Txn.sender() == pt.App.globalGet(club_admin_key)),
        pt.Assert(pt.App.globalGet(status_key) == STATUS_FUNDED),
        pt.App.globalPut(proof_hash_key, proof),
        pt.App.globalPut(status_key, STATUS_PROOF_SUBMITTED)
    ])

# Release funds (Sponsor or Admin)
@pt.Subroutine(pt.TealType.none)
def release_funds():
    receiver = pt.Txn.application_args[1]
    sender = pt.Txn.sender()
    sponsor = pt.App.globalGet(sponsor_key)
    admin = pt.App.globalGet(club_admin_key)
    amount = pt.App.globalGet(funded_amount_key)
    return pt.Seq([
        pt.Assert(pt.App.globalGet(status_key) == STATUS_PROOF_SUBMITTED),
        pt.Assert(pt.Or(sender == sponsor, sender == admin)),
        pt.InnerTxnBuilder.Begin(),
        pt.InnerTxnBuilder.SetFields({
            pt.TxnField.type_enum: pt.TxnType.Payment,
            pt.TxnField.receiver: receiver,
            pt.TxnField.amount: amount,
            pt.TxnField.fee: pt.Int(0)
        }),
        pt.InnerTxnBuilder.Submit(),
        pt.App.globalPut(status_key, STATUS_RELEASED)
    ])

# Main approval program
def approval_program():
    on_create_cond = pt.Txn.application_id() == pt.Int(0)
    create_purpose_cond = pt.Txn.application_args[0] == pt.Bytes("create_purpose")
    fund_purpose_cond = pt.Txn.application_args[0] == pt.Bytes("fund_purpose")
    submit_proof_cond = pt.Txn.application_args[0] == pt.Bytes("submit_proof")
    release_funds_cond = pt.Txn.application_args[0] == pt.Bytes("release_funds")

    return pt.Cond(
        [on_create_cond, on_create()],
        [create_purpose_cond, create_purpose()],
        [fund_purpose_cond, fund_purpose()],
        [submit_proof_cond, submit_proof()],
        [release_funds_cond, release_funds()]
    )

# Clear state program (simple)
def clear_state_program():
    return pt.Return(pt.Int(1))

# Compile to TEAL
if __name__ == "__main__":
    with open("approval.teal", "w") as f:
        f.write(pt.compileTeal(approval_program(), pt.Mode.Application, pt.Version(8)))

    with open("clear.teal", "w") as f:
        f.write(pt.compileTeal(clear_state_program(), pt.Mode.Application, pt.Version(8)))
