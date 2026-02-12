import React, { useState, useEffect } from 'react'
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

const ClubExit: React.FC<ClubExitProps> = ({ openModal, closeModal, role }) => {
  const { activeAddress } = useWallet()
  const [currentStep, setCurrentStep] = useState(1)
  const [tenureEndDate, setTenureEndDate] = useState('')
  const [tenureEndBlock, setTenureEndBlock] = useState('')
  const [newLeaderAddress, setNewLeaderAddress] = useState('')
  const [newLeaderName, setNewLeaderName] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [handoverRecords, setHandoverRecords] = useState<HandoverRecord[]>([])
  const [loading, setLoading] = useState(false)

  const steps: HandoverStep[] = [
    {
      id: 1,
      title: 'Set Tenure End',
      description: 'Define when the current leadership tenure expires',
      completed: currentStep > 1,
      active: currentStep === 1
    },
    {
      id: 2,
      title: 'Freeze Assets',
      description: 'Secure club funds and assets during transition',
      completed: currentStep > 2,
      active: currentStep === 2
    },
    {
      id: 3,
      title: 'Nominate Successor',
      description: 'New leader submits claim with verification',
      completed: currentStep > 3,
      active: currentStep === 3
    },
    {
      id: 4,
      title: 'Verify & Transfer',
      description: 'Confirm handover and transfer control',
      completed: currentStep > 4,
      active: currentStep === 4
    }
  ]

  useEffect(() => {
    if (openModal) {
      // Generate confirmation code when modal opens
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      setGeneratedCode(code)
    }
  }, [openModal])

  const addHandoverRecord = (action: string, details: string) => {
    const record: HandoverRecord = {
      timestamp: new Date().toLocaleString(),
      action,
      actor: activeAddress || 'Unknown',
      details
    }
    setHandoverRecords(prev => [record, ...prev])
  }

  const validateAddress = (address: string): boolean => {
    // Basic Algorand address validation (58 characters, base32)
    return address.length === 58 && /^[A-Z2-7]+$/.test(address)
  }

  const handleSetTenure = async () => {
    if (role !== 'Club Admin') {
      alert('Only Club Admin can set tenure')
      return
    }

    if (!tenureEndDate || !tenureEndBlock) {
      alert('Please fill in all tenure details')
      return
    }

    setLoading(true)
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000))

      addHandoverRecord('Tenure Set', `End Date: ${tenureEndDate}, End Block: ${tenureEndBlock}`)
      setCurrentStep(2)
      alert('✅ Tenure set successfully! Assets will be frozen at the specified time.')
    } catch (error) {
      alert('❌ Failed to set tenure')
    } finally {
      setLoading(false)
    }
  }

  const handleFreezeFunds = async () => {
    if (role !== 'Club Admin') {
      alert('Only Club Admin can freeze funds')
      return
    }

    if (!confirm('Are you sure you want to freeze all club assets? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000))

      addHandoverRecord('Assets Frozen', 'All club funds and assets have been frozen')
      setCurrentStep(3)
      alert('✅ Assets frozen successfully! New leadership can now be nominated.')
    } catch (error) {
      alert('❌ Failed to freeze assets')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimLeadership = async () => {
    if (!newLeaderAddress || !newLeaderName) {
      alert('Please fill in all nominee details')
      return
    }

    if (!validateAddress(newLeaderAddress)) {
      alert('Please enter a valid Algorand address')
      return
    }

    setLoading(true)
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000))

      addHandoverRecord('Leadership Claimed', `New leader: ${newLeaderName} (${newLeaderAddress})`)
      setCurrentStep(4)
      alert('✅ Leadership claim submitted! Verification code sent to current admin.')
    } catch (error) {
      alert('❌ Failed to submit leadership claim')
    } finally {
      setLoading(false)
    }
  }

  const handleTransferControl = async () => {
    if (confirmationCode !== generatedCode) {
      alert('Invalid confirmation code')
      return
    }

    if (!confirm('This will permanently transfer all club control to the new leader. Continue?')) {
      return
    }

    setLoading(true)
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000))

      addHandoverRecord('Control Transferred', `Control transferred to ${newLeaderName}`)
      setCurrentStep(5)
      alert('✅ Control transferred successfully! Handover complete.')
    } catch (error) {
      alert('❌ Failed to transfer control')
    } finally {
      setLoading(false)
    }
  }

  if (!openModal) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-xl mb-4">Club Exit & Handover System</h3>
        <p className="text-sm text-gray-600 mb-6">Secure leadership transition with immutable audit trail</p>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step.completed
                    ? 'bg-green-500 text-white'
                    : step.active
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step.completed ? '✓' : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-lg">{steps.find(s => s.active)?.title}</h4>
            <p className="text-sm text-gray-600">{steps.find(s => s.active)?.description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Set Tenure */}
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
                <button
                  className="btn btn-primary mt-4"
                  onClick={handleSetTenure}
                  disabled={loading}
                >
                  {loading ? 'Setting Tenure...' : 'Set Tenure & Schedule Freeze'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Freeze Assets */}
          {currentStep === 2 && role === 'Club Admin' && (
            <div className="card bg-orange-50 border border-orange-200">
              <div className="card-body">
                <h4 className="card-title text-orange-800">Freeze Club Assets</h4>
                <div className="alert alert-warning mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>This action will prevent any withdrawals until handover is complete.</span>
                </div>
                <button
                  className="btn btn-warning"
                  onClick={handleFreezeFunds}
                  disabled={loading}
                >
                  {loading ? 'Freezing Assets...' : 'Freeze All Assets'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Nominate Successor */}
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
                <button
                  className="btn btn-success mt-4"
                  onClick={handleClaimLeadership}
                  disabled={loading}
                >
                  {loading ? 'Submitting Claim...' : 'Submit Leadership Claim'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Verify & Transfer */}
          {currentStep === 4 && role === 'Club Admin' && (
            <div className="card bg-purple-50 border border-purple-200">
              <div className="card-body">
                <h4 className="card-title text-purple-800">Verify & Transfer Control</h4>
                <div className="alert alert-info mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Confirmation code sent to current admin: <strong>{generatedCode}</strong></span>
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
                  disabled={loading || confirmationCode.length !== 6}
                >
                  {loading ? 'Transferring Control...' : 'Transfer Control'}
                </button>
              </div>
            </div>
          )}

          {/* Completion Message */}
          {currentStep === 5 && (
            <div className="card bg-green-50 border border-green-200">
              <div className="card-body text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h4 className="card-title text-green-800">Handover Complete!</h4>
                <p className="text-green-700">Leadership has been successfully transferred to {newLeaderName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Audit Trail */}
        {handoverRecords.length > 0 && (
          <div className="mt-8">
            <h4 className="font-semibold mb-4">Handover Audit Trail</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {handoverRecords.map((record, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 min-w-0 flex-shrink-0">
                    {record.timestamp}
                  </div>
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
