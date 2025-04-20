# PolkaVault 🏦

A comprehensive digital asset management platform built on Polkadot technology.

![PolkaVault](https://img.shields.io/badge/PolkaVault-Asset%20Management-pink)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Polkadot](https://img.shields.io/badge/Polkadot-Network-E6007A)
[![Website](https://img.shields.io/badge/Website-cpxtb.net-green)](https://cpxtb.net)

## Overview

PolkaVault enables users to easily create, verify, and transfer blockchain assets while providing advanced DeFi capabilities like staking and liquidity pools. With an intuitive interface designed for both beginners and experienced users, PolkaVault simplifies the complex world of cryptocurrency assets, offering secure wallet connections, transparent transaction history, and multiple options to generate passive income through staking rewards and liquidity provision.

## Features

### Core Functionality
- **Asset Management**: Create, view, and transfer Polkadot-based assets
- **Asset Verification**: Verify assets on the blockchain
- **Transaction History**: Comprehensive history of all your asset transactions
- **Wallet Connection**: Seamless connection with Polkadot wallets

### DeFi Capabilities
- **Staking**: Stake assets to earn rewards over time
- **Liquidity Pools**: Provide liquidity and earn fees
- **Rewards Tracking**: Monitor your earnings from staking and liquidity provision

### User Experience
- **Mobile-Responsive Design**: Works on any device
- **Intuitive Dashboard**: Clear overview of all your assets and positions
- **Real-Time Updates**: Get instant feedback on transactions and balances

## Technical Stack

### Frontend
- React.js with TypeScript
- Vite for building
- Tailwind CSS with Shadcn UI components
- TanStack React Query for data fetching
- React Hook Form for form handling
- Wouter for routing
- Zod for validation

### Backend
- Express.js with TypeScript
- PostgreSQL database
- Drizzle ORM for database interactions
- RESTful API architecture

### Blockchain Integration
- @polkadot/api for blockchain interactions
- @polkadot/extension-dapp for wallet connections
- @polkadot/keyring for cryptographic operations

## Polkadot Technologies Used

PolkaVault leverages several key Polkadot technologies to provide a seamless blockchain experience:

### Core Polkadot Components
- **Polkadot.js API**: Connects directly to Westend Asset Hub via WebSocket RPC endpoints, providing access to on-chain functionality for asset management
- **Polkadot Extension Integration**: Uses web3Enable and web3Accounts from @polkadot/extension-dapp to connect to user wallets securely without exposing private keys
- **Asset Hub Parachain**: Interacts with Polkadot's specialized parachain for asset creation and management (formerly known as Statemint/Statemine)
- **Substrate Assets Module**: Utilizes the built-in assets pallet functions for creating, transferring, and verifying on-chain assets

### Technical Implementation Details
- **Transaction Construction**: Uses api.tx batching for complex operations that require multiple changes in a single atomic transaction
- **Runtime Metadata Handling**: Adapts to Substrate's dynamic type system to extract asset metadata and account information
- **ExtrinsicSignature**: Employs web3FromSource for secure transaction signing through the browser extension
- **Substrate Queries**: Leverages api.query to fetch asset information, balances and verify ownership directly from the blockchain state
- **BN (Big Number)**: Uses specialized handling for blockchain numeric values to maintain precision with large asset amounts

### Asset Operations
- **Create Asset**: api.tx.assets.create + api.tx.assets.setMetadata + api.tx.assets.mint
- **Transfer Asset**: api.tx.assets.transfer
- **Verify Asset**: api.query.assets.asset + api.query.assets.metadata
- **Get Balances**: api.query.assets.account

PolkaVault acts as a user-friendly interface to the otherwise complex Polkadot Asset Hub APIs, providing intuitive asset management with direct blockchain integration.

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Polkadot wallet extension (like Polkadot.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/polkavault.git
   cd polkavault
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with the following variables:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/polkavault
   NODE_ENV=development
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5000`

### Live Demo
Visit our live demo at [cpxtb.net](https://cpxtb.net) to try PolkaVault without installation.

## Application Flow

Below is a diagram showing the complete user flow and system architecture:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                         PolkaVault Application Flow                       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌───────────────────┐          ┌───────────────────┐        ┌───────────────┐
│   User Interface  │◄────────►│  Express Backend  │◄──────►│   PostgreSQL  │
│   (React + Vite)  │          │  (REST API)       │        │   Database    │
└───────────────────┘          └───────────────────┘        └───────────────┘
    │      ▲                           │    ▲
    │      │                           │    │
    ▼      │                           ▼    │
┌───────────────────┐          ┌───────────────────┐
│ Polkadot.js API   │◄────────►│ Blockchain Node   │
│ Extension         │          │ RPC Endpoint      │
└───────────────────┘          └───────────────────┘
    │
    │
    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                              User Workflows                               │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
    │
    ├─────┬─────────┬──────────┬────────────┬───────────┐
    │     │         │          │            │           │
    ▼     ▼         ▼          ▼            ▼           ▼
┌─────────┐  ┌────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐  ┌─────────┐
│ Connect │  │ Create │  │ Transfer │  │ Verify  │  │ Stake  │  │ Provide │
│ Wallet  │──► Asset  │──► Asset    │──► Assets  │──► Assets │──► Liquidity│
└─────────┘  └────────┘  └──────────┘  └─────────┘  └────────┘  └─────────┘
                                                        │           │
                                                        │           │
                                                        ▼           ▼
                                                     ┌─────────┐ ┌─────────┐
                                                     │ Claim   │ │ Withdraw│
                                                     │ Rewards │ │ Liquidity│
                                                     └─────────┘ └─────────┘
```

### Core System Interactions

1. **Frontend to Backend**: React frontend communicates with Express backend via REST API
2. **Backend to Database**: Backend performs CRUD operations on PostgreSQL database
3. **Frontend to Blockchain**: Direct communication through Polkadot.js API for transaction signing
4. **Backend to Blockchain**: Verification and blockchain data retrieval

### Data Flow

1. User connects wallet via Polkadot.js browser extension
2. Application loads user's assets from database and blockchain
3. When creating/transferring assets, transactions flow:
   - Frontend → Blockchain (for signature)
   - Frontend → Backend → Database (for persistence)
4. DeFi operations (staking, liquidity) follow a similar pattern with additional verification

### Transaction Flow Details

```
┌─────────┐      ┌─────────┐     ┌─────────────┐     ┌───────────┐     ┌─────────────┐
│  User   │      │Frontend │     │Polkadot.js  │     │Blockchain │     │  Backend    │
│         │      │(React)  │     │  Extension  │     │  Network  │     │(Express API)│
└────┬────┘      └────┬────┘     └──────┬──────┘     └─────┬─────┘     └──────┬──────┘
     │                │                 │                  │                  │
     │  Interact with │                 │                  │                  │
     │   Application  │                 │                  │                  │
     │───────────────►│                 │                  │                  │
     │                │                 │                  │                  │
     │                │  Request Wallet │                  │                  │
     │                │   Connection    │                  │                  │
     │                │────────────────►│                  │                  │
     │                │                 │                  │                  │
     │                │ Prompt for Auth │                  │                  │
     │◄───────────────┼─────────────────┼──────────────────┼──────────────────┤
     │                │                 │                  │                  │
     │   Authorize    │                 │                  │                  │
     │───────────────►│                 │                  │                  │
     │                │                 │                  │                  │
     │                │ Connect Account │                  │                  │
     │                │────────────────►│                  │                  │
     │                │                 │                  │                  │
     │                │  Account Info   │                  │                  │
     │                │◄────────────────┘                  │                  │
     │                │                 │                  │                  │
     │                │ Query Blockchain│                  │                  │
     │                │ State (Balance) │                  │                  │
     │                │─────────────────┼─────────────────►│                  │
     │                │                 │                  │                  │
     │                │                 │ Blockchain State │                  │
     │                │◄────────────────┼──────────────────┘                  │
     │                │                 │                  │                  │
     │  Create Asset  │                 │                  │                  │
     │  or Stake      │                 │                  │                  │
     │───────────────►│                 │                  │                  │
     │                │                 │                  │                  │
     │                │ Create TX and   │                  │                  │
     │                │ Request Sign    │                  │                  │
     │                │────────────────►│                  │                  │
     │                │                 │                  │                  │
     │                │ Confirm TX      │                  │                  │
     │◄───────────────┼─────────────────┘                  │                  │
     │                │                 │                  │                  │
     │  Sign TX       │                 │                  │                  │
     │───────────────►│                 │                  │                  │
     │                │                 │                  │                  │
     │                │  Signed TX      │                  │                  │
     │                │────────────────►│                  │                  │
     │                │                 │                  │                  │
     │                │                 │ Submit Signed TX │                  │
     │                │                 │─────────────────►│                  │
     │                │                 │                  │                  │
     │                │                 │  TX Hash/Receipt │                  │
     │                │◄────────────────┼──────────────────┘                  │
     │                │                 │                  │                  │
     │                │   Save TX to    │                  │                  │
     │                │   Database      │                  │                  │
     │                │──────────────────────────────────────────────────────►│
     │                │                 │                  │                  │
     │                │           TX Record Created        │                  │
     │                │◄──────────────────────────────────────────────────────┘
     │                │                 │                  │                  │
     │   Success      │                 │                  │                  │
     │   Notification │                 │                  │                  │
     │◄───────────────┘                 │                  │                  │
     │                │                 │                  │                  │
     │                │  Monitor TX     │                  │                  │
     │                │  for Updates    │                  │                  │
     │                │─────────────────┼─────────────────►│                  │
     │                │                 │                  │                  │
     │                │                 │ TX Confirmation  │                  │
     │                │◄────────────────┼──────────────────┘                  │
     │                │                 │                  │                  │
     │                │   Update TX     │                  │                  │
     │                │   Status        │                  │                  │
     │                │──────────────────────────────────────────────────────►│
     │                │                 │                  │                  │
     │                │           Status Updated           │                  │
     │                │◄──────────────────────────────────────────────────────┘
     │                │                 │                  │                  │
```

## Usage Guide

### Connecting Your Wallet
1. Click "Connect Wallet" in the header
2. Select your Polkadot.js account
3. Approve the connection

### Creating Assets
1. Navigate to "Create Asset" in the sidebar
2. Fill in the asset details (name, symbol, etc.)
3. Click "Create Asset" and approve the transaction in your wallet

### Staking Assets
1. Go to "Staking" in the sidebar
2. Select a staking pool
3. Enter the amount you want to stake
4. Click "Stake" and confirm the transaction

### Managing Liquidity Pools
1. Navigate to "Liquidity Pools"
2. Choose a pool or create a new one
3. Add liquidity by entering the amounts
4. Approve the transaction to add your assets to the pool

## Development

### Project Structure
```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and helpers
│   │   └── pages/       # Page components
├── server/              # Backend Express server
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   └── storage.ts       # Data storage interface
├── shared/              # Shared code
│   └── schema.ts        # Database schema and types
└── .env                 # Environment variables
```

### Database Model

PolkaVault uses a PostgreSQL database with the following entity relationships:

#### Core Entities
- **users** - User accounts with authentication
- **assets** - Digital assets created on the Polkadot blockchain
- **transactions** - Record of all asset operations

#### DeFi Entities
- **liquidity_pools** - Pools containing pairs of assets for trading
- **liquidity_positions** - User's positions in liquidity pools
- **staking_pools** - Pools for staking assets to earn rewards
- **staking_positions** - User's positions in staking pools

#### Entity Relationships
```
┌─────────┐     ┌──────────────────┐     ┌─────────────────┐
│  users  │─────┤ liquidityPositions├─────┤ liquidityPools  │
└─────────┘     └──────────────────┘     └─────────────────┘
     │                                            │
     │          ┌──────────────────┐              │
     └──────────┤ stakingPositions │              │
     │          └──────────────────┘              │
     │                   │                         │
     │                   │                         │
     │          ┌────────────────┐                 │
     └──────────┤ stakingPools   │                 │
     │          └────────────────┘                 │
     │                   │                         │
     │                   │                         │
     │          ┌────────────────┐                 │
     └──────────┤    assets      │─────────────────┘
                └────────────────┘
                        │
                        │
                ┌───────────────┐
                │ transactions  │
                └───────────────┘
```

#### Key Tables and Fields

**users**
- `id`: Primary key
- `username`: Unique username
- `password`: Securely stored password

**assets**
- `id`: Primary key
- `assetId`: Unique identifier on blockchain
- `name`: Asset name
- `symbol`: Asset symbol (ticker)
- `decimals`: Number of decimal places
- `balance`: Current holdings
- `creator`: Creator's wallet address

**transactions**
- `id`: Primary key
- `hash`: Unique blockchain transaction hash
- `type`: Transaction type (create, transfer, stake, etc.)
- `assetId`: Reference to the asset
- `amount`: Transaction amount
- `sender`/`recipient`: Wallet addresses
- `status`: Transaction status (pending, confirmed, failed)

**liquidity_pools**
- `id`: Primary key
- `name`: Pool name
- `assetAId`/`assetBId`: References to paired assets
- `reserveA`/`reserveB`: Current reserves of each asset
- `fee`: Trading fee percentage

**staking_pools**
- `id`: Primary key
- `assetId`: Reference to stakeable asset
- `rewardRate`: Annual reward percentage
- `minStakeAmount`: Minimum stake requirement
- `lockPeriodDays`: Required lock-up period

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

## Roadmap

- [ ] NFT support
- [ ] Cross-chain asset transfers
- [ ] Advanced analytics dashboard
- [ ] Mobile app version
- [ ] Additional DeFi protocols

## Contributing

We welcome contributions to PolkaVault! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The Polkadot team for creating an amazing blockchain ecosystem
- All the open-source libraries that made this project possible
- Our community of testers and early users

---

Made with ❤️ for the Polkadot community