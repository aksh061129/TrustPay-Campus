import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useSnackbar } from 'notistack'
import { SponsorshipFactory } from '../contracts/Sponsorship'
import { ellipseAddress } from '../utils/ellipseAddress'

interface SponsorshipCardProps {
  appId: string
  role: string
  algorand: AlgorandClient
}

interface Purpose {
  id: number
  name: string
  target: number
  funded: number
  sponsor: string
  proof: string
  status: string
}

const SponsorshipCard: React.FC<SponsorshipCardProps> = ({ appId, role, algorand }) => {
  const [purposes, setPurposes] = useState<Purpose[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [proofInputs, setProofInputs] = useState<{ [key: number]: string }>({})
  const [balance, setBalance] = useState<number>(0)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    if (transactionSigner) {
      algorand.setDefaultSigner(transactionSigner)
    }
  }, [algorand, transactionSigner])

  useEffect(() => {
    if (appId && activeAddress) {
      loadData()
      loadBalance()
    }
  }, [appId, activeAddress])

  const loadBalance = async () => {
    if (!activeAddress) return
    setBalanceLoading(true)
    try {
      const accountInfo = await algorand.account.getInformation(activeAddress)
      setBalance(Number(accountInfo.amount))
    } catch (err: any) {
      console.error('Error loading balance:', err)
      setError('Error loading wallet balance.')
    }
    setBalanceLoading(false)
  }

  const loadData = async () => {
    if (!appId) return
    setLoading(true)
    setError('')
    try {
      const factory = new SponsorshipFactory({
        defaultSender: activeAddress ?? undefined,
        algorand: algorand,
      })
      const appClient = factory.getAppClientById({ appId: BigInt(appId) })

      // Check if admin
      const clubAdmin = await appClient.state.global.clubAdmin()
      setIsAdmin(clubAdmin === activeAddress)

      // Load purposes with box existence checks
      let namesMap = new Map()
      let targetsMap = new Map()
      let fundedMap = new Map()
      let sponsorsMap = new Map()
      let proofsMap = new Map()
      let statusesMap = new Map()

      try {
        namesMap = await appClient.state.box.purposeNames.getMap()
        targetsMap = await appClient.state.box.purposeTargets.getMap()
        fundedMap = await appClient.state.box.purposeFundedAmounts.getMap()
        sponsorsMap = await appClient.state.box.purposeSponsors.getMap()
        proofsMap = await appClient.state.box.purposeProofHashes.getMap()
        statusesMap = await appClient.state.box.purposeStatuses.getMap()
      } catch (boxErr: any) {
        if (boxErr.message.includes('box not found') || boxErr.status === 404) {
          setError('Sponsorship data not found. Please ensure the contract has been deployed and purposes created.')
          setLoading(false)
          return
        }
        throw boxErr
      }

      const purposeList: Purpose[] = []
      for (const [id, name] of namesMap) {
        const target = targetsMap.get(id) || 0n
        const funded = fundedMap.get(id) || 0n
        const sponsor = sponsorsMap.get(id) || ''
        const proof = proofsMap.get(id) || ''
        const status = statusesMap.get(id) || ''
        purposeList.push({
          id: Number(id),
          name,
          target: Number(target),
          funded: Number(funded),
          sponsor,
          proof,
          status,
        })
      }
      setPurposes(purposeList)
    } catch (err: any) {
      setError(`Error loading data: ${err.message}`)
    }
    setLoading(false)
  }

  const handleCreateProof = async (purposeId: number, proofHash: string) => {
    if (!proofHash || (!proofHash.startsWith('ipfs://') && !proofHash.startsWith('Qm'))) {
      setError('Invalid IPFS CID. Must start with "ipfs://" or "Qm".')
      return
    }

    // Check balance before transaction
    if (balance < 200000) { // 0.2 ALGO in microAlgos
      setError('Insufficient balance. Please fund your account from TestNet dispenser.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const factory = new SponsorshipFactory({
        defaultSender: activeAddress ?? undefined,
        algorand: algorand,
      })
      const appClient = factory.getAppClientById({ appId: BigInt(appId) })

      // Create box name for the purpose
      const boxName = `proof${purposeId}`

      const result = await appClient.send.submitProof({
        args: {
          purposeId: BigInt(purposeId),
          proofHash: proofHash,
        },
      })
      enqueueSnackbar(`Proof submitted successfully! Transaction ID: ${result.txIds[0]}`, { variant: 'success' })
      loadData() // Refresh
      loadBalance() // Refresh balance
    } catch (err: any) {
      if (err.message.includes('account balance') || err.message.includes('below min')) {
        setError('Insufficient balance. Please fund your account from TestNet dispenser.')
      } else if (err.message.includes('box not found')) {
        setError('Box not found. Please ensure the contract is properly deployed.')
      } else {
        setError(`Error submitting proof: ${err.message}`)
      }
    }
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    let color = 'bg-gray-500'
    if (status === 'open') color = 'bg-yellow-500'
    else if (status === 'funded') color = 'bg-blue-500'
    else if (status === 'proved') color = 'bg-green-500'
    else if (status === 'released') color = 'bg-green-600'
    return <span className={`badge ${color} text-white`}>{status}</span>
  }

  if (!appId) {
    return <div className="alert alert-info">Please deploy or enter an App ID first.</div>
  }

  if (loading && purposes.length === 0) {
    return <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>
  }

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <div className="alert alert-info shadow-professional fade-in-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">💰</span>
            <span className="font-semibold">
              Wallet Balance: {balanceLoading ? (
                <span className="loading-shimmer inline-block w-20 h-4 rounded"></span>
              ) : (
                `${(balance / 1000000).toFixed(4)} ALGO`
              )}
            </span>
          </div>
          {balance < 200000 && !balanceLoading && (
            <span className="text-red-500 font-medium animate-pulse">⚠️ Low Balance</span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error shadow-professional fade-in-up">
          <span className="flex items-center space-x-2">
            <span className="text-lg">❌</span>
            <span>{error}</span>
          </span>
        </div>
      )}

      {purposes.map((purpose, index) => {
        const progressPercentage = purpose.target > 0 ? (purpose.funded / purpose.target) * 100 : 0
        return (
          <div
            key={purpose.id}
            className="card shadow-professional rounded-2xl p-6 gap-4 bg-white shadow-hover fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-800 mb-2">{purpose.name}</h3>
                <p className="text-sm text-gray-600 mb-3 flex items-center space-x-2">
                  <span>👤</span>
                  <span>Sponsor: {ellipseAddress(purpose.sponsor)}</span>
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Funding Progress</span>
                    <span>{purpose.funded} / {purpose.target} microAlgos</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {progressPercentage.toFixed(1)}% funded
                  </div>
                </div>
              </div>
              <div className="ml-4">
                {getStatusBadge(purpose.status)}
              </div>
            </div>

            {purpose.proof && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 mb-2 flex items-center space-x-2">
                  <span>📄</span>
                  <span className="font-medium">Proof Document:</span>
                </p>
                <a
                  href={`https://ipfs.io/ipfs/${purpose.proof.replace('ipfs://', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary text-sm hover:underline flex items-center space-x-1"
                >
                  <span>🔗</span>
                  <span>{purpose.proof.length > 30 ? `${purpose.proof.slice(0, 30)}...` : purpose.proof}</span>
                </a>
              </div>
            )}

            {isAdmin && purpose.status === 'funded' && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="IPFS CID (ipfs:// or Qm...)"
                    className="input input-bordered input-sm flex-1 focus:ring-2 focus:ring-blue-400 transition-all"
                    value={proofInputs[purpose.id] || ''}
                    onChange={(e) => setProofInputs({ ...proofInputs, [purpose.id]: e.target.value })}
                  />
                  <button
                    className="btn btn-primary btn-sm shadow-hover transition-all duration-200"
                    disabled={loading}
                    onClick={() => handleCreateProof(purpose.id, proofInputs[purpose.id] || '')}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <span className="mr-1">📝</span>
                        Create Proof
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {!isAdmin && role === 'Club Admin' && (
              <div className="alert alert-warning">
                <span className="flex items-center space-x-2">
                  <span>🚫</span>
                  <span>You are not authorized to create proofs for this purpose.</span>
                </span>
              </div>
            )}
          </div>
        )
      })}

      {purposes.length === 0 && !loading && (
        <div className="alert alert-info shadow-professional fade-in-up">
          <span className="flex items-center space-x-2">
            <span className="text-lg">📋</span>
            <span>No sponsorship purposes found. Create one to get started!</span>
          </span>
        </div>
      )}
    </div>
  )
}

export default SponsorshipCard
