# AssetChain

AssetChain is a decentralized web application enabling fractional ownership of real-world assets (RWA)—such as residential real estate, commercial property, renewable energy, artwork, and luxury collectibles—through blockchain tokenization.

The platform allows verified asset owners to tokenize physical assets into ERC-20 ownership tokens. Investors can purchase these tokens, trade them, receive profit distributions, and participate in governance decisions through a DAO on Polygon.

---

## 🌟 Key Features

- **Fractional Asset Ownership**: Tokenize physical assets into affordable ERC-20 ownership tokens.
- **On-Chain Verification**: Transparent asset registration, legal document IPFS CIDs, and verification status tracking.
- **Web3 & Nonce Signature Auth**: Dual authentication via JWT and EIP-191 MetaMask wallet signatures.
- **Marketplace & P2P Trading**: Primary offerings for initial asset tokenization and secondary listings for investor transfers.
- **DAO Governance**: Token-weighted voting power for proposal creation, asset maintenance, and dividend approvals.
- **Automated Profit Distribution**: Non-reentrant pull-based dividend claims for token holders via Treasury smart contracts.

---

## 🏗 System Architecture

| Layer | Technology Stack |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS v4, Lucide Icons, Vite, ethers.js v6 |
| **Backend** | Node.js, Express.js, TypeScript, Zod, Helmet, JWT, Rate-Limiter |
| **Database** | PostgreSQL (Supabase) with Row-Level Security & Triggers |
| **Smart Contracts** | Solidity ^0.8.20, OpenZeppelin v5, Hardhat, TypeChain |
| **Blockchain Target** | Polygon Amoy Testnet (Chain ID: 80002) |
| **Storage** | IPFS (Pinata) |

---

## 📁 Repository Structure

```text
AssetChain/
├── client/          # React Single Page Application (Vite + TS + Tailwind)
├── server/          # Express REST API & Web3 Authentication Service
├── contracts/       # Hardhat workspace with Solidity smart contracts
└── docs/            # Architecture specs, DB schemas, and roadmap
```

---

## ⚙️ Smart Contracts Overview

| Contract | Description |
|---|---|
| `AssetToken.sol` | ERC-20 ownership token with transfer whitelist and pause capabilities |
| `AssetTokenFactory.sol` | Factory contract deploying per-asset ERC-20 token instances |
| `AssetRegistry.sol` | Central registry for asset metadata, verification, and tokenization |
| `Marketplace.sol` | Escrow marketplace supporting primary token sales and P2P secondary listings |
| `Governance.sol` | DAO governance contract for proposal creation and token-weighted voting |
| `Treasury.sol` | Non-reentrant treasury handling claimable dividend distributions |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MetaMask**: Extension installed in browser

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/assetchain.git
cd assetchain

# Install root dependencies
npm install

# Install workspace dependencies
cd client && npm install
cd ../server && npm install
cd ../contracts && npm install
cd ..
```

### 2. Environment Setup

Create `.env` files in `server/` and `client/`:

**`server/.env`**:
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DATABASE_URL=postgresql://postgres:password@localhost:5432/assetchain
JWT_SECRET=your_jwt_secret_min_32_characters_long
JWT_EXPIRES_IN=7d
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
DEPLOYER_PRIVATE_KEY=0x_your_private_key
```

**`client/.env`**:
```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001
VITE_POLYGON_AMOY_CHAIN_ID=80002
VITE_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

### 3. Run Locally

```bash
# Start both server and client concurrently
npm run dev

# Or start services individually:
npm run dev:server    # Starts Express API at http://localhost:3001
npm run dev:client    # Starts Vite React App at http://localhost:5173
```

### 4. Smart Contract Compilation & Testing

```bash
# Compile Solidity contracts
cd contracts
npx hardhat compile

# Run Hardhat test suite
npx hardhat test
```

---

## 📄 Documentation

- 📐 [Architecture Specification](docs/ARCHITECTURE.md)
- 🗄 [Database Schema Design](docs/DATABASE.md)
- 📜 [Smart Contract Specs](docs/SMART_CONTRACTS.md)
- 🔌 [API Documentation](docs/API_SPEC.md)
- 🗺 [User Journeys & Flows](docs/USER_FLOW.md)
- 📁 [Folder Structure Guide](docs/FOLDER_STRUCTURE.md)
- 🚀 [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md)

---

