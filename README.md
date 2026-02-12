# TrustPay Campus

A decentralized finance platform for campus clubs built on Algorand. TrustPay Campus enables transparent fundraising, purpose-locked spending, conditional sponsorships, and secure leadership handovers using smart contracts—ensuring trust without intermediaries.

##  Features

### Core Functionality
- **Transparent Fundraising**: Clubs can raise funds through sponsorships with clear terms and conditions
- **Purpose-Locked Spending**: Funds are locked to specific purposes and can only be spent according to predefined rules
- **Conditional Sponsorships**: Sponsors can set conditions for fund release
- **Secure Leadership Handovers**: Smooth transition of club leadership with on-chain verification

### Financial Operations
- **Algo Transfers**: Send and receive ALGO cryptocurrency
- **On-Chain Banking**: Deposit, withdraw, and track transactions
- **ASA Token Creation**: Create custom fungible tokens for clubs
- **Asset Opt-In**: Participate in token ecosystems
- **NFT Minting**: Create and mint NFTs for collectibles and certificates

### Smart Contract Features
- **Bank Contract**: Handles deposits, withdrawals, and transaction tracking
- **Sponsorship Contract**: Manages sponsorship agreements and fund distribution
- **Group Expense Contract**: Manages shared expenses among group members
- **Counter Contract**: Simple counting functionality for demonstrations

## 🛠 Tech Stack

- **Blockchain**: Algorand
- **Smart Contracts**: PyTeal, Python
- **Frontend**: React, TypeScript, Tailwind CSS
- **Build Tools**: Vite, AlgoKit
- **IPFS**: Pinata for NFT metadata and media storage
- **Testing**: Jest, Playwright

##  Project Structure

```
TrustPay-Campus/
├── projects/
│   ├── contracts/                    # Smart contracts
│   │   ├── smart_contracts/
│   │   │   ├── bank/                # Bank contract
│   │   │   ├── counter/             # Counter contract
│   │   │   ├── group_expense/       # Group expense contract
│   │   │   ├── sponsorship/         # Sponsorship contract
│   │   │   └── artifacts/           # Compiled contract artifacts
│   │   └── tests/                   # Contract tests
│   └── frontend/                    # React frontend
│       ├── src/
│       │   ├── components/          # React components
│       │   │   ├── Bank.tsx         # Bank interface
│       │   │   ├── Sponsorship.tsx  # Sponsorship interface
│       │   │   ├── GroupExpense.tsx # Group expense interface
│       │   │   ├── ClubExit.tsx     # Leadership handover
│       │   │   ├── SendAlgo.tsx     # Algo transfer
│       │   │   ├── AssetOptIn.tsx   # Asset opt-in
│       │   │   ├── CreateASA.tsx    # Token creation
│       │   │   ├── MintNFT.tsx      # NFT minting
│       │   │   └── ...
│       │   ├── contracts/           # Generated contract clients
│       │   ├── utils/               # Utilities (Pinata, network, etc.)
│       │   └── styles/              # CSS styles
│       └── public/                  # Static assets
├── .algokit.toml                    # AlgoKit configuration
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

## Getting Started

### Prerequisites

- Docker (running)
- Node.js 18+ and npm
- Python 3.10+
- AlgoKit CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aksh061129/TrustPay-Campus.git
   cd TrustPay-Campus
   ```

2. **Bootstrap the project**
   ```bash
   algokit project bootstrap all
   ```

3. **Build all projects**
   ```bash
   algokit project build
   ```

4. **Install frontend dependencies**
   ```bash
   cd projects/frontend
   npm install
   ```

5. **Set up environment variables** (see Environment Variables section below)

6. **Start the development server**
   ```bash
   npm run dev
   ```

##  Environment Variables

Create `projects/frontend/.env` with the following variables:

```bash
# Algorand Network Configuration
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_PORT=
VITE_ALGOD_TOKEN=
VITE_ALGOD_NETWORK=testnet

# Indexer Configuration
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
VITE_INDEXER_PORT=
VITE_INDEXER_TOKEN=

# Pinata IPFS Configuration (for NFT minting)
VITE_PINATA_JWT=your_pinata_jwt_here
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs

# Optional: KMD Configuration (for local development)
VITE_KMD_SERVER=http://localhost
VITE_KMD_PORT=4002
VITE_KMD_TOKEN=a-super-secret-token
VITE_KMD_WALLET=unencrypted-default-wallet
VITE_KMD_PASSWORD=some-password
```

### Getting Pinata JWT
1. Create an account at [Pinata](https://app.pinata.cloud/)
2. Go to API Keys section
3. Generate a new JWT token
4. Add it to your `.env` file

##  Usage

### Connecting a Wallet
1. Open the application in your browser
2. Click "Connect Wallet" in the top navigation
3. Select your preferred wallet (Pera, MyAlgo, etc.)
4. Approve the connection

### Core Features

#### Bank Operations
- **Deposit**: Add funds to the club bank
- **Withdraw**: Withdraw funds (subject to club rules)
- **View Statements**: Check transaction history
- **View Depositors**: See all contributors

#### Sponsorship Management
- **Create Sponsorship**: Set up sponsorship agreements
- **View Active Sponsorships**: Monitor ongoing sponsorships
- **Release Funds**: Trigger fund release based on conditions

#### Group Expenses
- **Create Expense Group**: Set up shared expense tracking
- **Add Members**: Invite participants
- **Track Expenses**: Monitor spending and contributions

#### Token Operations
- **Create ASA**: Mint custom tokens for your club
- **Opt-in to Assets**: Participate in token ecosystems
- **Mint NFTs**: Create digital collectibles

#### Leadership Transition
- **Initiate Handover**: Start leadership transfer process
- **Verify Transition**: Confirm new leadership on-chain

##  Smart Contracts

### Bank Contract
Handles secure deposit and withdrawal operations with transaction tracking.

**Key Features:**
- Deposit funds with memos
- Withdraw funds (admin controlled)
- Transaction history via Indexer
- Depositor management

### Sponsorship Contract
Manages sponsorship agreements with conditional fund release.

**Key Features:**
- Create sponsorship terms
- Set release conditions
- Automatic fund distribution
- Sponsorship tracking

### Group Expense Contract
Manages shared expenses among multiple participants.

**Key Features:**
- Multi-member expense tracking
- Contribution management
- Expense settlement
- Member management

### Counter Contract
Simple demonstration contract for counting operations.

##  Frontend Components

### Main Components
- **Home**: Landing page with feature overview
- **Bank**: Bank operations interface
- **Sponsorship**: Sponsorship management
- **GroupExpense**: Group expense tracking
- **ClubExit**: Leadership handover
- **SendAlgo**: ALGO transfer interface
- **AssetOptIn**: Asset opt-in functionality
- **CreateASA**: Token creation interface
- **MintNFT**: NFT minting interface

### Utility Components
- **ConnectWallet**: Wallet connection
- **Account**: Account information display
- **Transact**: General transaction interface
- **AppCalls**: Smart contract interaction examples

## Testing

### Smart Contracts
```bash
cd projects/contracts
algokit project test
```

### Frontend
```bash
cd projects/frontend
npm test
```

### End-to-End Testing
```bash
cd projects/frontend
npx playwright test
```

## Deployment

### Smart Contracts
```bash
cd projects/contracts
algokit project deploy
```

### Frontend
The frontend can be deployed to Vercel, Netlify, or any static hosting service.

1. Build the project:
   ```bash
   cd projects/frontend
   npm run build
   ```

2. Deploy the `dist` folder to your hosting provider

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Links

- [Algorand Developer Documentation](https://developer.algorand.org/)
- [AlgoKit Documentation](https://developer.algorand.org/docs/get-started/algokit/)
- [Pinata Documentation](https://docs.pinata.cloud/)
- [React Documentation](https://reactjs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## Support

For questions and support, please open an issue on GitHub or contact the maintainers.

---

