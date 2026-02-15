import { useWallet } from '@txnlab/use-wallet-react'
import React, { useEffect, useMemo, useState } from 'react'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
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
import Navbar from './components/ui/Navbar'
import Sidebar from './components/ui/Sidebar'
import FeatureCard from './components/ui/FeatureCard'

interface HomeProps {}

interface FeatureItem {
  id: string
  title: string
  description: string
  category: string
  requiresWallet?: boolean
  actionLabel?: string
  testId?: string
  onOpen: () => void | Promise<void>
}

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
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('send-algo')

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

  const deployApp = async () => {
    try {
      if (!activeAddress) {
        alert('Connect wallet first')
        return
      }

      alert('Deploying Sponsorship contract...')

      const factory = new SponsorshipFactory({
        defaultSender: activeAddress,
        algorand,
      })

      const { appClient } = await factory.deploy({
        onUpdate: 'append',
        onSchemaBreak: 'append',
      })
      const appId = appClient.appId.toString()

      setDeployedAppId(appId)
      alert(`Deployment successful. App ID: ${appId}`)
    } catch (err: any) {
      console.error(err)
      alert(`Deploy failed: ${err.message ?? err}`)
    }
  }

  const features: FeatureItem[] = [
    {
      id: 'send-algo',
      title: 'Send Algo',
      description: 'Send a payment transaction to any address.',
      category: 'Payments',
      requiresWallet: true,
      onOpen: () => setSendAlgoModal(true),
    },
    {
      id: 'mint-nft',
      title: 'Mint NFT (ARC-3)',
      description: 'Upload metadata to IPFS and mint a single NFT.',
      category: 'Assets',
      requiresWallet: true,
      onOpen: () => setMintNftModal(true),
    },
    {
      id: 'create-asa',
      title: 'Create Token (ASA)',
      description: 'Mint a fungible ASA with custom supply and decimals.',
      category: 'Assets',
      requiresWallet: true,
      onOpen: () => setCreateAsaModal(true),
    },
    {
      id: 'asset-opt-in',
      title: 'Asset Opt-In',
      description: 'Opt-in to any existing ASA to receive tokens.',
      category: 'Assets',
      requiresWallet: true,
      onOpen: () => setAssetOptInModal(true),
    },
    {
      id: 'counter',
      title: 'Counter App',
      description: 'Interact with the shared on-chain counter app.',
      category: 'Contracts',
      requiresWallet: true,
      testId: 'appcalls-demo',
      onOpen: toggleAppCallsModal,
    },
    {
      id: 'bank',
      title: 'Bank Module',
      description: 'Deposit, withdraw, and view account statements.',
      category: 'Finance',
      requiresWallet: true,
      onOpen: () => setBankModal(true),
    },
    {
      id: 'sponsorship',
      title: 'Conditional Sponsorship',
      description: 'Create, fund, prove, and release purpose-locked support.',
      category: 'Finance',
      requiresWallet: true,
      onOpen: () => setSponsorshipModal(true),
    },
    {
      id: 'group-expense',
      title: 'Group Expense Locker',
      description: 'Pay-first group expense splitting flow.',
      category: 'Clubs',
      requiresWallet: true,
      onOpen: () => setGroupExpenseModal(true),
    },
    {
      id: 'club-exit',
      title: 'Club Exit & Handover',
      description: 'Manage leadership transfer and role handover.',
      category: 'Clubs',
      requiresWallet: true,
      onOpen: () => setClubExitModal(true),
    },
    {
      id: 'deploy-sponsorship',
      title: 'Deploy Sponsorship Contract',
      description: 'Deploy a new sponsorship app and capture its App ID.',
      category: 'Admin',
      requiresWallet: true,
      actionLabel: 'Deploy',
      onOpen: deployApp,
    },
  ]

  const selectedFeature = features.find((feature) => feature.id === selectedFeatureId) ?? features[0]

  const handleOpenSelected = () => {
    void selectedFeature.onOpen()
  }

  return (
    <div className="dashboard-bg min-h-screen text-slate-100">
      <div className="dashboard-orb dashboard-orb-1" />
      <div className="dashboard-orb dashboard-orb-2" />
      <div className="dashboard-orb dashboard-orb-3" />

      <Navbar
        appName="TrustPay Campus"
        network={algodConfig.network}
        activeAddress={activeAddress}
        onConnectWallet={toggleWalletModal}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 pb-6 pt-4 lg:grid lg:grid-cols-[260px,1fr,320px]">
        <aside className="glass-card rounded-2xl p-3 shadow-xl">
          <Sidebar
            items={features.map((feature) => ({
              id: feature.id,
              label: feature.title,
              category: feature.category,
            }))}
            selectedId={selectedFeature.id}
            onSelect={setSelectedFeatureId}
          />
        </aside>

        <main className="space-y-4">
          <section className="glass-card rounded-2xl p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Feature Overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{selectedFeature.title}</h2>
            <p className="mt-3 max-w-3xl text-sm text-slate-200/90">{selectedFeature.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                data-test-id={selectedFeature.testId}
                className="btn border-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-white hover:from-cyan-500 hover:to-indigo-600"
                disabled={Boolean(selectedFeature.requiresWallet && !activeAddress)}
                onClick={handleOpenSelected}
              >
                {selectedFeature.actionLabel ?? 'Open'}
              </button>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-slate-100">
                Category: {selectedFeature.category}
              </span>
              {!activeAddress && selectedFeature.requiresWallet ? (
                <span className="text-xs text-amber-200">Connect wallet to continue.</span>
              ) : null}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                title={feature.title}
                description={feature.description}
                category={feature.category}
                disabled={Boolean(feature.requiresWallet && !activeAddress)}
                actionLabel={feature.actionLabel ?? 'Open'}
                testId={feature.testId}
                onOpen={() => {
                  setSelectedFeatureId(feature.id)
                  void feature.onOpen()
                }}
              />
            ))}
          </section>
        </main>

        <aside className="glass-card space-y-4 rounded-2xl p-5 shadow-xl">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Workspace Controls</h3>
            <p className="mt-2 text-sm text-slate-200/90">Select role and sponsorship App ID used by modules.</p>
          </div>

          <label className="form-control w-full">
            <span className="mb-2 text-xs uppercase tracking-wide text-slate-200">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="select select-bordered w-full border-white/20 bg-slate-900/70 text-slate-100"
            >
              <option value="Member">Student</option>
              <option value="Sponsor">Club</option>
              <option value="Club Admin">Admin</option>
            </select>
          </label>

          <label className="form-control w-full">
            <span className="mb-2 text-xs uppercase tracking-wide text-slate-200">Sponsorship App ID</span>
            <input
              type="text"
              value={deployedAppId}
              onChange={(event) => setDeployedAppId(event.target.value)}
              placeholder="Enter existing or deployed app ID"
              className="input input-bordered w-full border-white/20 bg-slate-900/70 text-slate-100"
            />
          </label>

          <button
            className="btn w-full border-0 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white hover:from-amber-500 hover:to-red-600"
            disabled={!activeAddress}
            onClick={() => void deployApp()}
          >
            Deploy Sponsorship App
          </button>

          <div className="rounded-xl border border-white/20 bg-slate-950/70 p-3 text-xs text-slate-200">
            <p>Wallet: {activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'Not connected'}</p>
            <p className="mt-1">Network: {algodConfig.network}</p>
            <p className="mt-1">App ID: {deployedAppId || 'Not set'}</p>
          </div>
        </aside>
      </div>

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

