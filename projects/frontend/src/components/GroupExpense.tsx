import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface GroupExpenseProps {
  openModal: boolean
  closeModal: () => void
  role: string
}

interface PaymentStatus {
  member: string
  owed: number
  paid: number
  status: 'pending' | 'partial' | 'complete'
}

const GroupExpense: React.FC<GroupExpenseProps> = ({ openModal, closeModal, role }) => {
  const [expenseName, setExpenseName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [numMembers, setNumMembers] = useState('')
  const [memberAmount, setMemberAmount] = useState('')
  const [vendorAddress, setVendorAddress] = useState('')
  const [isCancelled, setIsCancelled] = useState(false)
  const [expenseId, setExpenseId] = useState('')
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([])
  const [expenseStatus, setExpenseStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [depositHistory, setDepositHistory] = useState<{amount: number, timestamp: string}[]>([])

  const { activeAddress, transactionSigner } = useWallet()
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })

  // Check if role is Sponsor and show alert
  useEffect(() => {
    if (role === 'Sponsor' && openModal) {
      alert('This feature is not available for Sponsors. Only Members and Club Admins can access Group Expense functionality.')
      closeModal()
    }
  }, [role, openModal, closeModal])

  const handleCreateExpense = () => {
    if (role !== 'Club Admin') {
      alert('Only Club Admin can create expenses')
      return
    }
    alert(`Expense "${expenseName}" created: Total ₹${totalAmount}, ${numMembers} members, ₹${memberAmount} each. Vendor: ${vendorAddress}`)
  }

  const handleDeposit = () => {
    if (!activeAddress) {
      alert('Please connect your wallet first')
      return
    }

    // Update payment status for current user
    setPaymentStatuses(prev => prev.map(status => {
      if (status.member === activeAddress.slice(0, 8) + '...') { // Mock member name
        const newPaid = Math.min(status.paid + parseInt(memberAmount), status.owed)
        let newStatus: 'pending' | 'partial' | 'complete' = 'pending'
        if (newPaid === status.owed) newStatus = 'complete'
        else if (newPaid > 0) newStatus = 'partial'

        return { ...status, paid: newPaid, status: newStatus }
      }
      return status
    }))

    // Add to deposit history
    setDepositHistory(prev => [...prev, {
      amount: parseInt(memberAmount),
      timestamp: new Date().toLocaleString()
    }])

    alert(`Deposited ₹${memberAmount} as ${role}. Payment status updated!`)
  }

  const handlePayVendor = () => {
    if (role !== 'Club Admin') {
      alert('Only Club Admin can pay vendor')
      return
    }
    alert(`Paying vendor at ${vendorAddress} with ₹${totalAmount}`)
  }

  const handleCancel = () => {
    if (role !== 'Club Admin') {
      alert('Only Club Admin can cancel')
      return
    }
    setIsCancelled(true)
    alert('Expense cancelled. Refunding all members.')
  }

  if (!openModal) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg">Pay-First Group Expense Locker</h3>
  
        {role === 'Club Admin' && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Expense Name</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Food Bill"
              className="input input-bordered"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
            />
            <label className="label">
              <span className="label-text">Total Amount (₹)</span>
            </label>
            <input
              type="number"
              placeholder="1500"
              className="input input-bordered"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
            <label className="label">
              <span className="label-text">Number of Members</span>
            </label>
            <input
              type="number"
              placeholder="5"
              className="input input-bordered"
              value={numMembers}
              onChange={(e) => setNumMembers(e.target.value)}
            />
            <label className="label">
              <span className="label-text">Amount per Member (₹)</span>
            </label>
            <input
              type="number"
              placeholder="300"
              className="input input-bordered"
              value={memberAmount}
              onChange={(e) => setMemberAmount(e.target.value)}
            />
            <label className="label">
              <span className="label-text">Vendor Address</span>
            </label>
            <input
              type="text"
              placeholder="Vendor wallet address"
              className="input input-bordered"
              value={vendorAddress}
              onChange={(e) => setVendorAddress(e.target.value)}
            />
            <button className="btn btn-primary mt-4" onClick={handleCreateExpense}>
              Create Expense
            </button>
          </div>
        )}

        {role === 'Member' && (
          <div className="form-control">
            <p>Deposit your share: ₹{memberAmount}</p>
            <button className="btn btn-success mt-4" onClick={handleDeposit}>
              Deposit ₹{memberAmount}
            </button>

            {/* Deposit History */}
            {depositHistory.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-green-800">Your Deposit History</h4>
                <div className="space-y-2">
                  {depositHistory.map((deposit, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded border border-green-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">💰</span>
                        <span className="font-medium">₹{deposit.amount}</span>
                      </div>
                      <span className="text-sm text-gray-600">{deposit.timestamp}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-green-700">
                    Total Deposited: ₹{depositHistory.reduce((sum, deposit) => sum + deposit.amount, 0)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {role === 'Club Admin' && !isCancelled && (
          <div className="mt-4">
            <button className="btn btn-info mr-2" onClick={handlePayVendor}>
              Pay Vendor
            </button>
            <button className="btn btn-warning" onClick={handleCancel}>
              Cancel & Refund
            </button>
          </div>
        )}

        {isCancelled && <p className="text-red-500 mt-4">Expense cancelled. Refunds initiated.</p>}

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
