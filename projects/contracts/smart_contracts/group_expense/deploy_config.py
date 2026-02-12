from algokit_utils import ApplicationSpecification

from smart_contracts.group_expense.contract import GroupExpense

app_spec = ApplicationSpecification.from_json(
    GroupExpense.arc56_json,
    override={"updatable": True, "deletable": True},
)

# Uncomment the below if you want to use local state
# app_spec = app_spec.with_global_state_schema_override(
#     declared={
#         "group_count": algopy.UInt64,
#         "expense_count": algopy.UInt64,
#     },
#     reserved={
#         "groups": algopy.BoxMap(algopy.UInt64, Group),
#         "expenses": algopy.BoxMap(algopy.UInt64, Expense),
#         "owed": algopy.BoxMap(tuple[algopy.UInt64, algopy.Account], algopy.UInt64),
#         "paid": algopy.BoxMap(tuple[algopy.UInt64, algopy.Account], algopy.UInt64),
#     },
# )
