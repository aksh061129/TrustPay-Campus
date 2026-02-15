import React from 'react'

interface NavbarProps {
  appName: string
  network: string
  activeAddress: string | null
  onConnectWallet: () => void
}

const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

const Navbar: React.FC<NavbarProps> = ({ appName, network, activeAddress, onConnectWallet }) => {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Campus Finance Dashboard</p>
          <h1 className="bg-gradient-to-r from-cyan-300 via-blue-300 to-fuchsia-300 bg-clip-text text-xl font-semibold text-transparent">{appName}</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-200/30 bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-100">
            {network}
          </span>

          <button
            data-test-id="connect-wallet"
            className="btn border-0 bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600"
            onClick={onConnectWallet}
          >
            {activeAddress ? truncateAddress(activeAddress) : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
