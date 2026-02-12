// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState, useMemo, useEffect } from 'react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { BankFactory } from './contracts/Bank'
import { SponsorshipFactory } from './contracts/Sponsorship'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import ConnectWallet from './components/ConnectWallet'
import AppCalls from './components/AppCalls'
import SendAlgo from './components/SendAlgo'
import MintNFT from './components/MintNFT'
import CreateASA from './components/CreateASA'
import AssetOptIn from './components/AssetOptIn'
import Bank from './components/Bank'
import Sponsorship from './components/Sponsorship'
import GroupExpense from './components/GroupExpense'
import ClubExit from './components/ClubExit'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const [sendAlgoModal, setSendAlgoModal] = useState<boolean>(false)
  const [mintNftModal, setMintNftModal] = useState<boolean>(false)
  const [createAsaModal, setCreateAsaModal] = useState<boolean>(false)
  const [assetOptInModal, setAssetOptInModal] = useState<boolean>(false)
  const [bankModal, setBankModal] = useState<boolean>(false)
  const [sponsorshipModal, setSponsorshipModal] = useState<boolean>(false)
  const [groupExpenseModal, setGroupExpenseModal] = useState<boolean>(false)
  const [clubExitModal, setClubExitModal] = useState<boolean>(false)
  const [role, setRole] = useState<string>('Member')
  const [deployedAppId, setDeployedAppId] = useState<string>('')
  const { activeAddress, transactionSigner } = useWallet()
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig, indexerConfig }), [algodConfig, indexerConfig])

  useEffect(() => {
    algorand.setDefaultSigner(transactionSigner)
  }, [algorand, transactionSigner])

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal)
  }

  // ✅ DEPLOY SPONSORSHIP SMART CONTRACT
  const deployApp = async () => {
    try {
      if (!activeAddress) {
        alert('Connect wallet first')
        return
      }

      alert('🚀 Deploying Sponsorship contract...')

      const factory = new SponsorshipFactory({
        defaultSender: activeAddress,
        algorand: algorand,
      })

      const { appClient } = await factory.deploy()
      const appId = appClient.appId.toString()

      setDeployedAppId(appId)
      alert(`✅ Deployment successful! App ID: ${appId}`)
    } catch (err: any) {
      console.error(err)
      alert(`❌ Deploy failed: ${err.message ?? err}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Professional Header */}
      <header className="relative z-10 p-6">
        <div className="flex justify-center items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-professional">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.84l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white professional-font">Algorand Workshop</h1>
              <p className="text-cyan-200 text-sm">Smart Contract Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 shadow-professional border border-white/20 max-w-7xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-extrabold text-white mb-4 professional-font text-gradient">
              Algorand Operations Hub
            </h2>
            <p className="text-xl text-gray-300 professional-font">
              Comprehensive blockchain operations in one unified platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Wallet Controls Section */}
            <div className="card bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-xl">
              <div className="card-body text-center">
                <h2 className="card-title justify-center">Wallet & Role</h2>
                <div className="flex flex-col items-center space-y-4">
                  <button
                    data-test-id="connect-wallet"
                    className={`btn px-6 py-3 text-sm font-semibold rounded-full shadow-professional shadow-hover transition-all duration-300 ${
                      activeAddress
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600'
                    }`}
                    onClick={toggleWalletModal}
                  >
                    {activeAddress ? 'Wallet Connected' : 'Connect Wallet'}
                  </button>
                  {activeAddress && (
                    <div className="w-full max-w-xs space-y-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-xs font-medium text-gray-300 uppercase tracking-wide">Wallet Address</label>
                        <div className="text-sm text-white bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 font-mono">
                          {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-xs font-medium text-gray-300 uppercase tracking-wide">Role</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="text-sm bg-white/10 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                        >
                          <option value="Member" className="text-gray-900">Member</option>
                          <option value="Sponsor" className="text-gray-900">Sponsor</option>
                          <option value="Club Admin" className="text-gray-900">Club Admin</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Send Algo</h2>
                <p>Send a payment transaction to any address.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setSendAlgoModal(true)}>Open</button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Mint NFT (ARC-3)</h2>
                <p>Upload to IPFS via Pinata and mint a single NFT.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setMintNftModal(true)}>Open</button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Create Token (ASA)</h2>
                <p>Mint a fungible ASA with custom supply and decimals.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setCreateAsaModal(true)}>Open</button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Asset Opt-In</h2>
                <p>Opt-in to any existing ASA to receive tokens.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setAssetOptInModal(true)}>Open</button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xl md:col-span-2 lg:col-span-1">
              <div className="card-body">
                <h2 className="card-title">Counter (App ID 747652603)</h2>
                <p>Interact with the shared on-chain counter app.</p>
                <div className="card-actions justify-end">
                  <button
                    data-test-id="appcalls-demo"
                    className="btn btn-outline"
                    disabled={!activeAddress}
                    onClick={toggleAppCallsModal}
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-xl md:col-span-2 lg:col-span-1">
              <div className="card-body">
                <h2 className="card-title">Bank</h2>
                <p>Deposit and withdraw ALGOs and view statements.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setBankModal(true)}>Open</button>
                </div>
              </div>
            </div>

            {/* ✅ SPONSORSHIP CARD */}
            <div className="card bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Conditional Sponsorship</h2>
                <p>Purpose-locked funding: Create → Fund → Prove → Release</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setSponsorshipModal(true)}>Open</button>
                </div>
              </div>
            </div>

            {/* ✅ GROUP EXPENSE CARD */}
            <div className="card bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Pay-First Group Expense Locker</h2>
                <p>Group Expense Spliter</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setGroupExpenseModal(true)}>Open</button>
                </div>
              </div>
            </div>

            {/* ✅ CLUB EXIT CARD */}
            <div className="card bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Club Exit & Handover System</h2>
                <p>Adapt Leadership Changes</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={() => setClubExitModal(true)}>Open</button>
                </div>
              </div>
            </div>

            {/* ✅ DEPLOY APP CARD */}
            <div className="card bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Deploy Smart Contract</h2>
                <p>Approve deployment using Pera Wallet</p>
                {deployedAppId && (
                  <p className="text-sm">Deployed App ID: {deployedAppId}</p>
                )}
                <div className="card-actions justify-end">
                  <button className="btn btn-outline" disabled={!activeAddress} onClick={deployApp}>
                    Deploy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
      <SendAlgo openModal={sendAlgoModal} closeModal={() => setSendAlgoModal(false)} />
      <MintNFT openModal={mintNftModal} closeModal={() => setMintNftModal(false)} />
      <CreateASA openModal={createAsaModal} closeModal={() => setCreateAsaModal(false)} />
      <AssetOptIn openModal={assetOptInModal} closeModal={() => setAssetOptInModal(false)} />
      <Bank openModal={bankModal} closeModal={() => setBankModal(false)} />
      <Sponsorship openModal={sponsorshipModal} closeModal={() => setSponsorshipModal(false)} role={role} appId={deployedAppId} />
      <GroupExpense openModal={groupExpenseModal} closeModal={() => setGroupExpenseModal(false)} role={role} />
      <ClubExit openModal={clubExitModal} closeModal={() => setClubExitModal(false)} role={role} />
    </div>
  )
}

export default Home
