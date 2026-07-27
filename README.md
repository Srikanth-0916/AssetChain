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
