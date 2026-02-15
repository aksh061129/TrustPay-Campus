import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import * as algokit from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { SponsorshipFactory } from '../contracts/Sponsorship'
import SponsorshipCard from './SponsorshipCard'

interface SponsorshipProps {
  openModal: boolean
  closeModal: () => void
  role: string
  appId?: string
}

const MICROALGOS_PER_ALGO = 1_000_000

function algoToMicroBigInt(value: string): bigint | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null

  const converted = Math.round(Number(trimmed) * MICROALGOS_PER_ALGO)
  if (!Number.isFinite(converted) || !Number.isSafeInteger(converted) || converted <= 0) return null
  return BigInt(converted)
}

function parseIdToBigInt(value: string): bigint | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const normalized = trimmed.replace(/^[pP]/, '')
  if (!/^\d+$/.test(normalized)) return null

  const parsed = BigInt(normalized)
  return parsed > 0n ? parsed : null
}

const Sponsorship: React.FC<SponsorshipProps> = ({ openModal, closeModal, role, appId: propAppId }) => {
  const [purposeName, setPurposeName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [proofHash, setProofHash] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')
  const [appId, setAppId] = useState(propAppId || '')
  const [purposeId, setPurposeId] = useState('')
  const [purposeDetails, setPurposeDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { activeAddress, transactionSigner } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })

  useEffect(() => {
    if (transactionSigner) {
      algorand.setDefaultSigner(transactionSigner)
    }
  }, [algorand, transactionSigner])

  const createPurpose = async () => {
    if (!activeAddress || role !== 'Club Admin') {
      alert('Only Club Admin can create purposes')
      return
    }
    if (!appId || !purposeName || !targetAmount) {
      alert('Please enter App ID, Purpose Name, and Target Amount')
      return
    }
    setLoading(true)
    try {
      const parsedAppId = parseIdToBigInt(appId)
      const targetMicroAlgos = algoToMicroBigInt(targetAmount)
      if (!parsedAppId || !targetMicroAlgos) {
        alert('Enter a valid App ID and target amount in ALGO (e.g., 0.1)')
        setLoading(false)
        return
      }

      const factory = new SponsorshipFactory({
        defaultSender: activeAddress ?? undefined,
        algorand: algorand,
      })
      const appClient = factory.getAppClientById({ appId: parsedAppId })
      const result = await appClient.send.createPurpose({
        args: {
          name: purposeName,
          target: targetMicroAlgos,
        },
      })
      if (result.return !== undefined) {
        alert(`Purpose created successfully! Purpose ID: ${result.return}, Transaction ID: ${result.txIds[0]}`)
        setPurposeId(result.return.toString())
      } else {
        alert(`Purpose created successfully! Transaction ID: ${result.txIds[0]}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const fundPurpose = async () => {
    if (!activeAddress || role !== 'Sponsor') {
      alert('Only Sponsor can fund purposes')
      return
    }
    if (!appId || !purposeId || !targetAmount) {
      alert('Please enter App ID, Purpose ID, and Amount to fund')
      return
    }
    setLoading(true)
    try {
      const parsedAppId = parseIdToBigInt(appId)
      const parsedPurposeId = parseIdToBigInt(purposeId)
      const amountMicroAlgos = algoToMicroBigInt(targetAmount)
      if (!parsedAppId || !parsedPurposeId || !amountMicroAlgos) {
        alert('Enter valid App ID, Purpose ID, and ALGO amount (e.g., 0.1)')
        setLoading(false)
        return
      }

      const factory = new SponsorshipFactory({
        defaultSender: activeAddress ?? undefined,
        algorand: algorand,
      })
      const appClient = factory.getAppClientById({ appId: parsedAppId })

      // Create a payment transaction to the app address
      const payTxn = await algorand.createTransaction.payment({
        sender: activeAddress,
        receiver: appClient.appAddress,
        amount: algokit.microAlgos(amountMicroAlgos),
      })

      const result = await appClient.send.fundPurpose({
        args: {
          purposeId: parsedPurposeId,
          payTxn: payTxn,
        },
      })
      alert(`Purpose funded successfully! Transaction ID: ${result.txIds[0]}`)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const submitProof = async () => {
    if (!activeAddress || role !== 'Club Admin') {
      alert('Only Club Admin can submit proof')
      return
    }
    if (!appId || !purposeId || !proofHash) {
      alert('Please enter App ID, Purpose ID, and Proof Hash')
      return
    }
    setLoading(true)
    try {
      const parsedAppId = parseIdToBigInt(appId)
      const parsedPurposeId = parseIdToBigInt(purposeId)
      if (!parsedAppId || !parsedPurposeId) {
        alert('Enter valid App ID and Purpose ID')
        setLoading(false)
        return
      }

      const factory = new SponsorshipFactory({
        defaultSender: activeAddress ?? undefined,
        algorand: algorand,
      })
      const appClient = factory.getAppClientById({ appId: parsedAppId })
      const result = await appClient.send.submitProof({
        args: {
          purposeId: parsedPurposeId,
          proofHash: proofHash,
        },
      })
      alert(`Proof submitted successfully! Transaction ID: ${result.txIds[0]}`)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  const releaseFunds = async () => {
    if (!activeAddress || (role !== 'Sponsor' && role !== 'Club Admin')) {
      alert('Only Sponsor or Club Admin can release funds')
      return
    }
    if (!appId || !purposeId || !receiverAddress) {
      alert('Please enter App ID, Purpose ID, and Receiver Address')
      return
    }
    setLoading(true)
    try {
      const parsedAppId = parseIdToBigInt(appId)
      const parsedPurposeId = parseIdToBigInt(purposeId)
      if (!parsedAppId || !parsedPurposeId) {
        alert('Enter valid App ID and Purpose ID')
        setLoading(false)
        return
      }
      if (!algosdk.isValidAddress(receiverAddress.trim())) {
        alert('Please enter a valid receiver address')
        setLoading(false)
        return
      }

      const factory = new SponsorshipFactory({
        defaultSender: activeAddress ?? undefined,
        algorand: algorand,
      })
      const appClient = factory.getAppClientById({ appId: parsedAppId })
      const status = await appClient.state.box.purposeStatuses.value(parsedPurposeId)
      if (status !== 'proved') {
        alert('Proof not received, cannot release funds')
        setLoading(false)
        return
      }
      const result = await appClient.send.releaseFunds({
        args: {
          purposeId: parsedPurposeId,
          receiver: receiverAddress.trim(),
        },
      })
      alert(`Funds released successfully! Transaction ID: ${result.txIds[0]}`)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
    setLoading(false)
  }

  if (!openModal) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl shadow-professional">
        <h3 className="font-bold text-2xl mb-6 professional-font text-gradient">Conditional Sponsorship - {role}</h3>

        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-semibold text-gray-700">App ID</span>
          </label>
          <input
            type="text"
            placeholder="Enter deployed app ID"
            className="input input-bordered focus:ring-2 focus:ring-blue-400 transition-all"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
          />
        </div>

        {role === 'Club Admin' && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Create Purpose</span>
              </label>
              <input
                type="text"
                placeholder="Purpose name"
                className="input input-bordered"
                value={purposeName}
                onChange={(e) => setPurposeName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Target amount in ALGO (e.g., 0.1)"
                className="input input-bordered mt-2"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
              <button
                className="btn btn-primary mt-2"
                onClick={createPurpose}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Purpose'}
              </button>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Submit Proof</span>
              </label>
              <input
                type="text"
                placeholder="Proof hash/URL"
                className="input input-bordered"
                value={proofHash}
                onChange={(e) => setProofHash(e.target.value)}
              />
              <button
                className="btn btn-secondary mt-2"
                onClick={submitProof}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Proof'}
              </button>
            </div>
          </div>
        )}

        {role === 'Sponsor' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
              <h4 className="font-semibold text-lg mb-4 text-emerald-800 flex items-center space-x-2">
                <span>💰</span>
                <span>Fund Purpose</span>
              </h4>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Purpose ID</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter purpose ID to fund"
                  className="input input-bordered focus:ring-2 focus:ring-emerald-400 transition-all"
                  value={purposeId}
                  onChange={(e) => setPurposeId(e.target.value)}
                />
                <label className="label mt-3">
                  <span className="label-text font-medium">Funding Amount (ALGO)</span>
                </label>
                <input
                  type="number"
                  placeholder="Amount to contribute (e.g., 0.1)"
                  className="input input-bordered focus:ring-2 focus:ring-emerald-400 transition-all"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
                <button
                  className="btn btn-success mt-4 shadow-hover transition-all duration-200"
                  onClick={fundPurpose}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Funding Purpose...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💸</span>
                      Fund Purpose
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
              <h4 className="font-semibold text-lg mb-4 text-amber-800 flex items-center space-x-2">
                <span>🔓</span>
                <span>Release Funds</span>
              </h4>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Purpose ID</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter purpose ID"
                  className="input input-bordered focus:ring-2 focus:ring-amber-400 transition-all"
                  value={purposeId}
                  onChange={(e) => setPurposeId(e.target.value)}
                />
                <label className="label mt-3">
                  <span className="label-text font-medium">Receiver Address</span>
                </label>
                <input
                  type="text"
                  placeholder="Beneficiary wallet address"
                  className="input input-bordered focus:ring-2 focus:ring-amber-400 transition-all"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                />
                <button
                  className="btn btn-warning mt-4 shadow-hover transition-all duration-200"
                  onClick={releaseFunds}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Releasing Funds...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🔓</span>
                      Release Funds
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {role === 'Member' && (
          <div className="space-y-4">
            <div className="alert alert-info">
              <span>Members can view sponsorship activities but cannot perform actions.</span>
            </div>
            <SponsorshipCard appId={appId} role={role} algorand={algorand} />
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={closeModal}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default Sponsorship
