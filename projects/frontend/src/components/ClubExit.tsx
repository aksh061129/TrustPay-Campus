import React, { useEffect, useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'

interface ClubExitProps {
  openModal: boolean
  closeModal: () => void
  role: string
}

interface HandoverStep {
  id: number
  title: string
  description: string
  completed: boolean
  active: boolean
}

interface HandoverRecord {
  timestamp: string
  action: string
  actor: string
  details: string
}

const CLUB_NEW_ADMIN_KEY = 'club_new_admin'

type StatusVariant = 'info' | 'success' | 'error' | 'warning'

const ClubExit: React.FC<ClubExitProps> = ({ openModal, closeModal, role }) => {
  const { activeAddress, wallets } = useWallet()
  const [currentStep, setCurrentStep] = useState(1)
  const [tenureEndDate, setTenureEndDate] = useState('')
  const [tenureEndBlock, setTenureEndBlock] = useState('')
  const [newLeaderAddress, setNewLeaderAddress] = useState('')
  const [newLeaderName, setNewLeaderName] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [handoverRecords, setHandoverRecords] = useState<HandoverRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [expectedAdminAddress, setExpectedAdminAddress] = useState('')
  const [handoverSuccessMessage, setHandoverSuccessMessage] = useState('')
  const [walletActionMessage, setWalletActionMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusVariant, setStatusVariant] = useState<StatusVariant>('info')

  const steps: HandoverStep[] = [
    {
      id: 1,
      title: 'Set Tenure End',
      description: 'Define when the current leadership tenure expires',
      completed: currentStep > 1,
      active: currentStep === 1,
    },
    {
      id: 2,
      title: 'Freeze Assets',
      description: 'Secure club funds and assets during transition',
      completed: currentStep > 2,
      active: currentStep === 2,
    },
    {
      id: 3,
      title: 'Nominate Successor',
      description: 'New leader submits claim with verification',
      completed: currentStep > 3,
      active: currentStep === 3,
    },
    {
      id: 4,
      title: 'Verify & Transfer',
      description: 'Confirm handover and transfer control',
      completed: currentStep > 4,
      active: currentStep === 4,
    },
  ]

  const normalizeAddress = (address: string) => address.trim().toUpperCase()

  const adminMismatch = useMemo(() => {
    if (!expectedAdminAddress) return false
    return normalizeAddress(activeAddress || '') !== normalizeAddress(expectedAdminAddress)
  }, [activeAddress, expectedAdminAddress])

  const canUseAdminActions = role === 'Club Admin' && !adminMismatch

  const setStatus = (variant: StatusVariant, message: string) => {
    setStatusVariant(variant)
    setStatusMessage(message)
  }

  useEffect(() => {
    if (!openModal) return
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setGeneratedCode(code)
    const storedAdmin = localStorage.getItem(CLUB_NEW_ADMIN_KEY) || ''
    setExpectedAdminAddress(storedAdmin)
    setStatusMessage('')
    setWalletActionMessage('')
    setHandoverSuccessMessage('')
  }, [openModal])

  const addHandoverRecord = (action: string, details: string) => {
    const record: HandoverRecord = {
      timestamp: new Date().toLocaleString(),
      action,
      actor: activeAddress || 'Unknown',
      details,
    }
    setHandoverRecords((prev) => [record, ...prev])
  }

  const validateAddress = (address: string): boolean => {
    return address.length === 58 && /^[A-Z2-7]+$/.test(address)
  }

  const handleDisconnectWallet = async () => {
    setWalletActionMessage('')
    if (!wallets) return

    const activeWallet = wallets.find((wallet) => wallet.isActive)
    if (activeWallet) {
      await activeWallet.disconnect()
      setWalletActionMessage('Wallet disconnected. Please connect the new admin wallet.')
      return
    }

    localStorage.removeItem('@txnlab/use-wallet:v3')
    window.location.reload()
  }

  const handleReconnectWallet = async () => {
    setWalletActionMessage('')
    if (!wallets || wallets.length === 0) {
      setWalletActionMessage('No wallet providers detected. Open Connect Wallet and reconnect manually.')
      return
    }

    try {
      const candidateWallet = wallets.find((wallet) => !wallet.isActive) ?? wallets[0]
      await candidateWallet.connect()
      setWalletActionMessage('Reconnect triggered. Select the new admin account in your wallet.')
    } catch {
      setWalletActionMessage('Reconnect not triggered automatically. Open Connect Wallet and reconnect manually.')
    }
  }

  const handleSetTenure = async () => {
    if (!canUseAdminActions) {
      setStatus(
        'warning',
        'Admin wallet mismatch. Switch to the expected admin wallet before running admin actions.',
      )
      return
    }

    if (!tenureEndDate || !tenureEndBlock) {
      setStatus('error', 'Please fill in tenure end date and tenure end block.')
      return
    }

    setLoading(true)
    setStatusMessage('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      addHandoverRecord('Tenure Set', `End Date: ${tenureEndDate}, End Block: ${tenureEndBlock}`)
      setCurrentStep(2)
      setStatus('success', 'Tenure set successfully. Assets can now be frozen for transition.')
    } catch {
      setStatus('error', 'Failed to set tenure. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const handleFreezeFunds = async () => {
    if (!canUseAdminActions) {
      setStatus(
        'warning',
        'Admin wallet mismatch. Switch to the expected admin wallet before running admin actions.',
      )
      return
    }

    setLoading(true)
    setStatusMessage('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      addHandoverRecord('Assets Frozen', 'All club funds and assets have been frozen')
      setCurrentStep(3)
      setStatus('success', 'Assets frozen successfully. New leadership can now be nominated.')
    } catch {
      setStatus('error', 'Failed to freeze assets. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimLeadership = async () => {
    if (!newLeaderAddress || !newLeaderName) {
      setStatus('error', 'Please fill in nominee name and address.')
      return
    }

    if (!validateAddress(normalizeAddress(newLeaderAddress))) {
      setStatus('error', 'Please enter a valid Algorand address for the new leader.')
      return
    }

    setLoading(true)
    setStatusMessage('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      addHandoverRecord('Leadership Claimed', `New leader: ${newLeaderName} (${normalizeAddress(newLeaderAddress)})`)
      setCurrentStep(4)
      setStatus('success', 'Leadership claim submitted. Enter confirmation code to transfer control.')
    } catch {
      setStatus('error', 'Failed to submit leadership claim. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const handleTransferControl = async () => {
    setHandoverSuccessMessage('')
    setWalletActionMessage('')

    if (!canUseAdminActions) {
      setStatus(
        'warning',
        'Admin wallet mismatch. Switch to the expected admin wallet before running admin actions.',
      )
      return
    }

    if (confirmationCode !== generatedCode) {
      setStatus('error', 'Invalid confirmation code.')
      return
    }

    setLoading(true)
    setStatusMessage('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      addHandoverRecord('Control Transferred', `Control transferred to ${newLeaderName}`)
      setCurrentStep(5)

      const normalizedNewAdmin = normalizeAddress(newLeaderAddress)
      setExpectedAdminAddress(normalizedNewAdmin)
      localStorage.setItem(CLUB_NEW_ADMIN_KEY, normalizedNewAdmin)
      setHandoverSuccessMessage('Handover successful. New admin must connect their wallet now.')
      setStatus('success', 'Control transfer complete. Disconnect and reconnect as the new admin wallet.')
    } catch {
      setStatus('error', 'Failed to transfer control. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  const verifyExpectedAdmin = () => {
    const storedAdmin = localStorage.getItem(CLUB_NEW_ADMIN_KEY) || ''
    setExpectedAdminAddress(storedAdmin)
    if (storedAdmin) {
      setStatus('info', 'Expected admin refreshed from saved handover state.')
      return
    }
    setStatus('info', 'No saved admin found. Complete handover first or load contract admin if available.')
  }

  if (!openModal) return null

  const statusClassName =
    statusVariant === 'error'
      ? 'border-red-300 bg-red-50 text-red-800'
      : statusVariant === 'success'
        ? 'border-green-300 bg-green-50 text-green-800'
        : statusVariant === 'warning'
          ? 'border-amber-300 bg-amber-50 text-amber-900'
          : 'border-slate-300 bg-slate-50 text-slate-700'

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-xl mb-4">Club Exit & Handover System</h3>
        <p className="text-sm text-gray-600 mb-6">Secure leadership transition with immutable audit trail</p>

        {expectedAdminAddress ? (
          <div
            className={`mb-4 rounded-lg border p-3 text-sm ${
              adminMismatch ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-green-300 bg-green-50 text-green-800'
            }`}
          >
            <p>
              <strong>Expected Admin:</strong> <span className="font-mono break-all">{expectedAdminAddress}</span>
            </p>
            <p>
              <strong>Connected Wallet:</strong> <span className="font-mono break-all">{activeAddress || 'Not connected'}</span>
            </p>
            {adminMismatch ? (
              <p className="mt-1">Connected wallet does not match expected admin. Admin actions are disabled until wallet is switched.</p>
            ) : (
              <p className="mt-1">Connected wallet matches expected admin.</p>
            )}
          </div>
        ) : null}

        {statusMessage ? <div className={`mb-4 rounded-lg border p-3 text-sm ${statusClassName}`}>{statusMessage}</div> : null}

        {handoverSuccessMessage ? (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            <p>{handoverSuccessMessage}</p>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-sm btn-warning" onClick={handleDisconnectWallet}>
                Disconnect Wallet
              </button>
              <button className="btn btn-sm btn-info" onClick={handleReconnectWallet}>
                I am New Admin - Reconnect
              </button>
            </div>
            {walletActionMessage ? <p className="mt-2 text-xs">{walletActionMessage}</p> : null}
          </div>
        ) : null}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step.completed ? 'bg-green-500 text-white' : step.active ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step.completed ? 'OK' : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-lg">{steps.find((s) => s.active)?.title}</h4>
            <p className="text-sm text-gray-600">{steps.find((s) => s.active)?.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          {currentStep === 1 && role === 'Club Admin' && (
            <div className="card bg-blue-50 border border-blue-200">
              <div className="card-body">
                <h4 className="card-title text-blue-800">Set Leadership Tenure</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Tenure End Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={tenureEndDate}
                      onChange={(e) => setTenureEndDate(e.target.value)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Tenure End Block</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 1000000"
                      className="input input-bordered"
                      value={tenureEndBlock}
                      onChange={(e) => setTenureEndBlock(e.target.value)}
                    />
                  </div>
                </div>
                <button className="btn btn-primary mt-4" onClick={handleSetTenure} disabled={loading || !canUseAdminActions}>
                  {loading ? 'Setting Tenure...' : 'Set Tenure & Schedule Freeze'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && role === 'Club Admin' && (
            <div className="card bg-orange-50 border border-orange-200">
              <div className="card-body">
                <h4 className="card-title text-orange-800">Freeze Club Assets</h4>
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 mb-4">
                  This action will prevent withdrawals until handover is complete.
                </div>
                <button className="btn btn-warning" onClick={handleFreezeFunds} disabled={loading || !canUseAdminActions}>
                  {loading ? 'Freezing Assets...' : 'Freeze All Assets'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="card bg-green-50 border border-green-200">
              <div className="card-body">
                <h4 className="card-title text-green-800">Nominate New Leader</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">New Leader Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Full name of new leader"
                      className="input input-bordered"
                      value={newLeaderName}
                      onChange={(e) => setNewLeaderName(e.target.value)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">New Leader Address</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Algorand wallet address"
                      className="input input-bordered font-mono text-sm"
                      value={newLeaderAddress}
                      onChange={(e) => setNewLeaderAddress(e.target.value)}
                    />
                  </div>
                </div>
                <button className="btn btn-success mt-4" onClick={handleClaimLeadership} disabled={loading}>
                  {loading ? 'Submitting Claim...' : 'Submit Leadership Claim'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && role === 'Club Admin' && (
            <div className="card bg-purple-50 border border-purple-200">
              <div className="card-body">
                <h4 className="card-title text-purple-800">Verify & Transfer Control</h4>
                <div className="rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm text-sky-800 mb-4">
                  Confirmation code for this demo flow: <strong>{generatedCode}</strong>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Enter Confirmation Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter the 6-character code"
                    className="input input-bordered font-mono text-center text-lg tracking-widest"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
                <button
                  className="btn btn-info mt-4"
                  onClick={handleTransferControl}
                  disabled={loading || confirmationCode.length !== 6 || !canUseAdminActions}
                >
                  {loading ? 'Transferring Control...' : 'Transfer Control'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="card bg-green-50 border border-green-200">
              <div className="card-body text-center">
                <div className="text-6xl mb-4">Done</div>
                <h4 className="card-title text-green-800">Handover Complete!</h4>
                <p className="text-green-700">Leadership has been successfully transferred to {newLeaderName}</p>
              </div>
            </div>
          )}
        </div>

        {handoverRecords.length > 0 && (
          <div className="mt-8">
            <h4 className="font-semibold mb-4">Handover Audit Trail</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {handoverRecords.map((record, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 min-w-0 flex-shrink-0">{record.timestamp}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{record.action}</div>
                    <div className="text-xs text-gray-600">{record.details}</div>
                    <div className="text-xs text-gray-500 font-mono">{record.actor.slice(0, 8)}...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <button className="btn btn-outline btn-sm" onClick={verifyExpectedAdmin}>
            Verify Admin
          </button>
        </div>

        <div className="modal-action">
          <button className="btn" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClubExit
