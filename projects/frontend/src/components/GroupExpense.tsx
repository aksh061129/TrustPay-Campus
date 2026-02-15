import React, { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import * as algokit from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { useSnackbar } from 'notistack'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface GroupExpenseProps {
  openModal: boolean
  closeModal: () => void
  role: string
}

interface GroupRecord {
  id: number
  name: string
  members: [string, string, string]
}

interface ExpenseRecord {
  id: number
  groupId: number
  name: string
  totalAlgoInput: string
  totalMicroAlgos: bigint
  splitType: 'equal' | 'custom'
  memberCount: number
}

const MICROALGOS_PER_ALGO = 1_000_000
const ESTIMATED_TXN_FEE_MICROALGOS = 2_000n

function parsePositiveInteger(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const parsed = Number(trimmed)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null
  return parsed
}

function algoToMicroBigInt(value: string): bigint | null {
  const trimmed = value.trim()
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null
  const converted = Math.round(Number(trimmed) * MICROALGOS_PER_ALGO)
  if (!Number.isFinite(converted) || !Number.isSafeInteger(converted) || converted <= 0) return null
  return BigInt(converted)
}

function isAlgorandAddressValid(address: string): boolean {
  const trimmed = address.trim()
  if (!trimmed) return false

  try {
    return algosdk.isValidAddress(trimmed)
  } catch {
    return trimmed.length === 58 && /^[A-Z2-7]+$/.test(trimmed)
  }
}

function toBigIntAmount(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(value)) return BigInt(value)
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value)
  return 0n
}

const GroupExpense: React.FC<GroupExpenseProps> = ({ openModal, closeModal, role }) => {
  const { enqueueSnackbar } = useSnackbar()
  const { activeAddress, transactionSigner } = useWallet()

  const [appIdInput, setAppIdInput] = useState('')
  const [groupName, setGroupName] = useState('')
  const [member1, setMember1] = useState('')
  const [member2, setMember2] = useState('')
  const [member3, setMember3] = useState('')

  const [groupIdInput, setGroupIdInput] = useState('')
  const [expenseName, setExpenseName] = useState('')
  const [totalFundAlgo, setTotalFundAlgo] = useState('')
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [studentExpenseIdInput, setStudentExpenseIdInput] = useState('')

  const [groups, setGroups] = useState<GroupRecord[]>([])
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [nextGroupId, setNextGroupId] = useState(1)
  const [nextExpenseId, setNextExpenseId] = useState(1)
  const [errorMessage, setErrorMessage] = useState('')
  const [amountFieldError, setAmountFieldError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [addingExpense, setAddingExpense] = useState(false)
  const [payingShare, setPayingShare] = useState(false)
  const [studentPayFieldError, setStudentPayFieldError] = useState('')

  const isAdmin = role === 'Admin' || role === 'Club Admin'
  const isStudent = role === 'Student' || role === 'Member'

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig, indexerConfig }), [algodConfig, indexerConfig])

  useEffect(() => {
    if (transactionSigner) {
      algorand.setDefaultSigner(transactionSigner)
    }
  }, [algorand, transactionSigner])

  useEffect(() => {
    if (!openModal) {
      setErrorMessage('')
      setAmountFieldError('')
      setStudentPayFieldError('')
      setSuccessMessage('')
    }
  }, [openModal])

  const setError = (message: string) => {
    setSuccessMessage('')
    setErrorMessage(message)
    enqueueSnackbar(message, { variant: 'error' })
  }

  const setSuccess = (message: string) => {
    setErrorMessage('')
    setSuccessMessage(message)
    enqueueSnackbar(message, { variant: 'success' })
  }

  const handleDeploy = async () => {
    setErrorMessage('')
    setAmountFieldError('')
    setSuccessMessage('')

    if (!activeAddress) return setError('Connect wallet first')

    const parsedAppId = parsePositiveInteger(appIdInput)
    if (!parsedAppId) return setError('Application ID must be a positive integer')

    setDeploying(true)
    try {
      // Existing flow currently uses manual App ID input; keep it and mark as active.
      setAppIdInput(parsedAppId.toString())
      setSuccess(`Application ID ${parsedAppId} loaded.`)
    } catch (error: any) {
      setError(error?.message ?? 'Failed to load application')
    } finally {
      setDeploying(false)
    }
  }

  const handleCreateGroup = async () => {
    setErrorMessage('')
    setAmountFieldError('')
    setSuccessMessage('')

    if (!isAdmin) return setError('Admin only')

    const parsedAppId = parsePositiveInteger(appIdInput)
    if (!parsedAppId) return setError('Application ID must be a positive integer')
    if (!groupName.trim()) return setError('Group name is required')
    if (!isAlgorandAddressValid(member1)) return setError('Member 1 address is invalid')
    if (!isAlgorandAddressValid(member2)) return setError('Member 2 address is invalid')
    if (!isAlgorandAddressValid(member3)) return setError('Member 3 address is invalid')

    const normalizedMembers = [member1.trim(), member2.trim(), member3.trim()]
    if (new Set(normalizedMembers).size !== normalizedMembers.length) {
      return setError('Member addresses must be unique')
    }

    setCreatingGroup(true)
    try {
      const createdGroup: GroupRecord = {
        id: nextGroupId,
        name: groupName.trim(),
        members: [normalizedMembers[0], normalizedMembers[1], normalizedMembers[2]],
      }

      // Preserve current frontend-only group state while keeping wallet/client setup untouched.
      setGroups((prev) => [...prev, createdGroup])
      setNextGroupId((prev) => prev + 1)
      setGroupIdInput(String(createdGroup.id))
      setSuccess(`Group "${createdGroup.name}" created with ID ${createdGroup.id}.`)
    } catch (error: any) {
      setError(error?.message ?? 'Failed to create group')
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleAddExpenseAndPay = async () => {
    setErrorMessage('')
    setAmountFieldError('')
    setSuccessMessage('')

    if (!isAdmin) return setError('Admin only')
    if (!activeAddress) return setError('Connect wallet first')

    const parsedAppId = parsePositiveInteger(appIdInput)
    const parsedGroupId = parsePositiveInteger(groupIdInput)
    const amountMicro = algoToMicroBigInt(totalFundAlgo)

    if (!parsedAppId) return setError('Application ID must be a positive integer')
    if (!parsedGroupId) return setError('Group ID must be a positive integer')
    if (!expenseName.trim()) return setError('Expense name is required')
    if (!amountMicro) {
      const msg = 'Total Fund Amount must be a valid ALGO value (e.g., 0.1)'
      setAmountFieldError(msg)
      return setError(msg)
    }
    if (!groups.some((group) => group.id === parsedGroupId)) return setError('Group ID does not exist')

    setAddingExpense(true)
    try {
      const selectedGroup = groups.find((group) => group.id === parsedGroupId)
      if (!selectedGroup) {
        setError('Group ID does not exist')
        setAddingExpense(false)
        return
      }

      // Prevent overspending below protocol minimum balance.
      const accountInfo = (await algorand.account.getInformation(activeAddress)) as Record<string, unknown>
      const balanceMicroAlgos = toBigIntAmount(accountInfo.amount)
      const minBalanceMicroAlgos = toBigIntAmount(accountInfo.minBalance ?? accountInfo['min-balance'])
      const spendableMicroAlgos = balanceMicroAlgos - minBalanceMicroAlgos - ESTIMATED_TXN_FEE_MICROALGOS

      if (amountMicro > spendableMicroAlgos) {
        const deficitMicro = amountMicro - (spendableMicroAlgos > 0n ? spendableMicroAlgos : 0n)
        const deficitAlgo = Number(deficitMicro) / MICROALGOS_PER_ALGO
        const msg = `Insufficient spendable balance. You must keep minimum balance. Need at least ${deficitAlgo.toFixed(6)} ALGO more.`
        setAmountFieldError(msg)
        setError(msg)
        setAddingExpense(false)
        return
      }

      const appAddress = algosdk.getApplicationAddress(parsedAppId)
      await algorand.send.payment({
        sender: activeAddress,
        receiver: appAddress,
        amount: algokit.microAlgos(amountMicro),
      })

      const createdExpense: ExpenseRecord = {
        id: nextExpenseId,
        groupId: parsedGroupId,
        name: expenseName.trim(),
        totalAlgoInput: totalFundAlgo.trim(),
        totalMicroAlgos: amountMicro,
        splitType,
        memberCount: selectedGroup.members.length,
      }
      setExpenses((prev) => [...prev, createdExpense])
      setNextExpenseId((prev) => prev + 1)
      setStudentExpenseIdInput(String(createdExpense.id))

      if (splitType === 'custom') {
        setSuccess(`Expense #${createdExpense.id} "${expenseName}" paid to app escrow. Custom split can be configured in the next step.`)
      } else {
        setSuccess(`Expense #${createdExpense.id} "${expenseName}" added and paid successfully.`)
      }
    } catch (error: any) {
      setError(error?.message ?? 'Failed to add expense and pay')
    } finally {
      setAddingExpense(false)
    }
  }

  const handlePayMyShare = async () => {
    setErrorMessage('')
    setStudentPayFieldError('')
    setSuccessMessage('')

    if (!isStudent) return setError('Student only')
    if (!activeAddress) return setError('Connect wallet first')

    const parsedAppId = parsePositiveInteger(appIdInput)
    if (!parsedAppId) return setError('Application ID must be a positive integer')

    const parsedExpenseId = parsePositiveInteger(studentExpenseIdInput)
    if (!parsedExpenseId) {
      const msg = 'Expense ID must be a positive integer'
      setStudentPayFieldError(msg)
      return setError(msg)
    }

    const expense = expenses.find((item) => item.id === parsedExpenseId)
    if (!expense) {
      const msg = 'Expense not loaded. Select a valid Expense ID created by Admin.'
      setStudentPayFieldError(msg)
      return setError(msg)
    }

    const totalMicroAlgos = algoToMicroBigInt(expense.totalAlgoInput)
    if (!totalMicroAlgos) {
      const msg = 'Expense total is invalid or missing; cannot calculate share.'
      setStudentPayFieldError(msg)
      return setError(msg)
    }

    if (!Number.isInteger(expense.memberCount) || expense.memberCount <= 0) {
      const msg = 'Member count is invalid for this expense.'
      setStudentPayFieldError(msg)
      return setError(msg)
    }

    const shareMicroAlgos = totalMicroAlgos / BigInt(expense.memberCount)
    if (shareMicroAlgos <= 0n) {
      const msg = 'Calculated share amount is invalid. Check total amount and member count.'
      setStudentPayFieldError(msg)
      return setError(msg)
    }

    setPayingShare(true)
    try {
      const appAddress = algosdk.getApplicationAddress(parsedAppId)
      const suggestedParams = await algorand.getSuggestedParams()
      const firstRoundValue =
        (suggestedParams as any).firstRound ?? (suggestedParams as any).firstValidRound ?? (suggestedParams as any).firstValid
      const firstRound = Number(firstRoundValue)
      if (!Number.isFinite(firstRound) || firstRound <= 0) {
        setStudentPayFieldError('Could not fetch fresh network rounds. Please retry.')
        setError('Could not fetch fresh network rounds. Please retry.')
        setPayingShare(false)
        return
      }

      // Keep txn alive longer to reduce "txn dead: round outside range" failures.
      ;(suggestedParams as any).lastRound = firstRound + 1000
      algorand.setSuggestedParamsCache(suggestedParams, new Date(Date.now() + 15_000))

      await algorand.send.payment({
        sender: activeAddress,
        receiver: appAddress,
        amount: algokit.microAlgos(shareMicroAlgos),
        firstValidRound: firstRound,
        validityWindow: 1000,
      })

      const shareInAlgo = Number(shareMicroAlgos) / MICROALGOS_PER_ALGO
      setSuccess(`Share paid successfully (${shareInAlgo.toFixed(6)} ALGO).`)
    } catch (error: any) {
      setError(error?.message ?? 'Failed to pay your share')
    } finally {
      setPayingShare(false)
    }
  }

  if (!openModal) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl">
        <h3 className="text-2xl font-bold">Pay-First Group Expense Locker</h3>

        {isStudent ? (
          <div className="mt-5 space-y-5">
            {errorMessage ? (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
            ) : null}
            {successMessage ? (
              <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">{successMessage}</div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,160px]">
              <label className="form-control">
                <span className="mb-2 text-sm font-medium">Application ID</span>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered"
                  placeholder="Enter application ID"
                  value={appIdInput}
                  onChange={(event) => setAppIdInput(event.target.value)}
                />
              </label>
              <button className="btn btn-primary mt-0 md:mt-8" disabled={deploying} onClick={handleDeploy}>
                {deploying ? 'Deploying...' : 'Deploy'}
              </button>
            </div>

            <h4 className="text-center text-lg font-semibold">Your Expenses</h4>

            <div className="space-y-3">
              {expenses.length > 0 ? (
                <select
                  className="select select-bordered w-full"
                  value={studentExpenseIdInput}
                  onChange={(event) => {
                    setStudentExpenseIdInput(event.target.value)
                    setStudentPayFieldError('')
                  }}
                >
                  <option value="">Select Expense ID</option>
                  {expenses.map((expense) => (
                    <option key={expense.id} value={expense.id}>
                      {`Expense #${expense.id} - ${expense.name}`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Expense ID"
                  value={studentExpenseIdInput}
                  onChange={(event) => {
                    setStudentExpenseIdInput(event.target.value)
                    setStudentPayFieldError('')
                  }}
                />
              )}
              {studentPayFieldError ? <p className="text-sm text-red-600">{studentPayFieldError}</p> : null}

              <button className="btn btn-secondary w-full" disabled={payingShare} onClick={handlePayMyShare}>
                {payingShare ? 'Paying...' : 'Pay My Share'}
              </button>

              <p className="text-sm text-blue-600 underline">Click to pay your share to the contract</p>
            </div>
          </div>
        ) : isAdmin ? (
          <div className="mt-5 space-y-5">
            {errorMessage ? (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
            ) : null}
            {successMessage ? (
              <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">{successMessage}</div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,160px]">
              <label className="form-control">
                <span className="mb-2 text-sm font-medium">Application ID</span>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered"
                  placeholder="Enter application ID"
                  value={appIdInput}
                  onChange={(event) => setAppIdInput(event.target.value)}
                />
              </label>
              <button className="btn btn-primary mt-0 md:mt-8" disabled={deploying} onClick={handleDeploy}>
                {deploying ? 'Deploying...' : 'Deploy'}
              </button>
            </div>

            <section className="rounded-xl border border-base-300 p-4">
              <h4 className="text-lg font-semibold">Create Group</h4>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Group Name"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered font-mono text-sm"
                  placeholder="Member 1 Address"
                  value={member1}
                  onChange={(event) => setMember1(event.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered font-mono text-sm"
                  placeholder="Member 2 Address"
                  value={member2}
                  onChange={(event) => setMember2(event.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered font-mono text-sm"
                  placeholder="Member 3 Address"
                  value={member3}
                  onChange={(event) => setMember3(event.target.value)}
                />
                <button className="btn btn-secondary" disabled={creatingGroup} onClick={handleCreateGroup}>
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </section>

            <div className="divider my-1" />

            <section className="rounded-xl border border-base-300 p-4">
              <h4 className="text-lg font-semibold">Add Expense</h4>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <input
                  type="number"
                  min="1"
                  className="input input-bordered"
                  placeholder="Group ID"
                  value={groupIdInput}
                  onChange={(event) => setGroupIdInput(event.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Expense Name"
                  value={expenseName}
                  onChange={(event) => setExpenseName(event.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.000001"
                  className="input input-bordered"
                  placeholder="Total Fund Amount (ALGO)"
                  value={totalFundAlgo}
                  onChange={(event) => {
                    setTotalFundAlgo(event.target.value)
                    setAmountFieldError('')
                  }}
                />
                {amountFieldError ? <p className="text-sm text-red-600">{amountFieldError}</p> : null}
                <select
                  className="select select-bordered"
                  value={splitType}
                  onChange={(event) => setSplitType(event.target.value as 'equal' | 'custom')}
                >
                  <option value="equal">Equal Split</option>
                  <option value="custom">Custom Split</option>
                </select>
                <textarea
                  className="textarea textarea-bordered h-24"
                  readOnly
                  value={
                    splitType === 'equal'
                      ? 'Equal Split selected: total amount is distributed equally among members.'
                      : 'Custom Split selected: payment is submitted now; configure final member split in next step.'
                  }
                />
                <button className="btn btn-accent" disabled={addingExpense} onClick={handleAddExpenseAndPay}>
                  {addingExpense ? 'Processing...' : 'Add Expense & Pay'}
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Admin only</div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default GroupExpense
