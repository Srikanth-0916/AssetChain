# TrustChain AI

> **Decentralized Real-World Asset Tokenization Platform**  
> Built for final-year project evaluation · Polygon Amoy Testnet · Gemini AI · AES-256-GCM Encrypted

TrustChain AI enables fractional ownership of physical real-world assets — commercial real estate, renewable energy facilities, and residential property — through blockchain tokenization, AI-powered verification, and multi-signature legal approval.

---

## ⚠️ Production Status & Security Posture

> **Hardened Prototype Deployed on Polygon Amoy Testnet.**  
> Smart contracts have NOT been audited by an independent security firm for mainnet launch. Do not use real funds.

| Subsystem | Development Behavior (`NODE_ENV=development`) | Production Behavior (`NODE_ENV=production`) | Security Controls |
|-----------|---------------------------------------------|--------------------------------------------|-------------------|
| **Audit Service** | In-memory + Supabase write warning | Fail-Close (HTTP 503 on DB error) | Append-only log, critical alerts |
| **Approval Workflow** | 2-of-3 policy engine (Off-chain default) | Fail-Close (HTTP 503 on DB error) | Role validation, duplicate vote block. By default (when `GNOSIS_SAFE_ADDRESS` is not configured), operates in Off-Chain Policy Engine Mode. |
| **Compliance Engine** | In-memory + Supabase write-through | Fail-Close (HTTP 503 on DB error) | ERC-3643 whitelist, KYC status codes |
| **Document Encryption** | AES-256-GCM Authenticated Enc. | AES-256-GCM Authenticated Enc. | 96-bit random IV, 128-bit auth tag |
| **Prompt Injection Protection** | 18 regex patterns + Unicode strip | 18 regex patterns + Unicode strip | Auto +30 fraud score, manual review |
| **Payments (Razorpay)** | Sandbox Mode | Sandbox Mode | HMAC signature verification |
| **AI Copilot** | Gemini 2.0 Flash + Fallback | Gemini 2.0 Flash + Fallback | Deterministic math, zero invention |
| **System Health API** | Live status check | Live status check | `GET /api/v1/system/health` |

---

## ⚡ Measured Engineering Performance Metrics

Summary of the 10-Phase Master Engineering Pass optimizations:

| Metric / Subsystem | Before Optimization | After 10-Phase Pass | Improvement |
|--------------------|----------------------|---------------------|-------------|
| **Backend Test Suite Duration** | 10.24 seconds | **6.74 seconds** | **34.2% faster execution** |
| **Client Main JS Bundle Size** | 790.91 kB | **300.62 kB** | **62.0% bundle footprint reduction** |
| **Vite Client Production Build** | 919 ms | **691 ms** | **24.8% build speedup** |
| **Compliance Profile Lookups** | Direct DB query on every request | In-memory TTL cache (1-min) | Eliminates DB roundtrips for warm profiles |
| **Trust Score Calculation** | Sequential `await` lookups | Concurrent `Promise.all` | Multi-resource parallel retrieval |
| **AI Rate Limit Handling** | Repeated failing network calls on 429 | 30s short-circuit backoff | Zero redundant 429 API calls |
| **Contract Listener Indexer** | Dynamic topic hash regex parsing | Pre-computed topic hash array | Zero regex parsing overhead in 30s poll loop |
| **JWT Verification** | Library default verify | Explicit `HS256` algorithm whitelist | Hardened against algorithm confusion |

---

## 🧪 Test Coverage (47 / 47 Passed)

| Test Suite | File | Tests Passed | Domain Covered |
|------------|------|--------------|----------------|
| **Smart Contract Audit** | `contracts/test/core.test.ts` | 2 / 2 | Full asset lifecycle, marketplace secondary sales |
| **Contract Security Suite** | `contracts/test/security.test.ts` | 6 / 6 | KYC restriction, Pausable, Revoked KYC, Jurisdiction, Whitelist |
| **Treasury Hardening Suite**| `contracts/test/treasury.test.ts` | 4 / 4 | Snapshot accounting, dividend calculation, double-claim block |
| **Backend Hardening Suite** | `server/tests/hardening.test.ts` | 16 / 16 | Multi-sig edge cases, KYC control, Prompt sanitizer, AI breakdown |
| **Modules 13-17 Suite** | `server/tests/modules.test.ts` | 8 / 8 | SPV, Multi-Sig, Compliance ERC-3643, Nominee workflow |
| **AI Observability Suite** | `server/tests/observability.test.ts` | 2 / 2 | Telemetry & fallback metrics |
| **Recommendation Suite** | `server/tests/recommendation.test.ts` | 3 / 3 | Deterministic scoring & ranking |
| **AI System Suite** | `server/tests/ai.test.ts` | 5 / 5 | Gemini integration & mock fallback |
| **Auth Suite** | `server/tests/auth.test.ts` | 1 / 1 | JWT & EIP-191 authentication |
| **TOTAL** | **9 Test Suites** | **47 / 47 Passed** | **100% Passing Status** |

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/Srikanth-0916/AssetChain.git
cd AssetChain

# Install dependencies
cd client && npm install
cd ../server && npm install
cd ../contracts && npm install

# Run full-stack application (root directory)
npm run dev

# Run smart contract tests
cd contracts && npx hardhat test

# Run backend tests
cd server && npx vitest run
```

---

## 📑 System Health API Response Format

```json
{
  "gemini": "healthy",
  "polygon": "connected",
  "supabase": "healthy",
  "payments": "sandbox",
  "contracts": "verified",
  "recommendationEngine": "healthy",
  "ai": "healthy",
  "uptime": 3600,
  "timestamp": "2026-07-29T16:30:00.000Z"
}
```

---

## 📄 Documentation Suite

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Technical topology, security model, and fail-close specs.
- [SECURITY.md](docs/SECURITY.md) — Threat model, AES-256-GCM spec, prompt injection pipeline.
- [DATABASE.md](docs/DATABASE.md) — Database schema, performance indexes, and query optimizations.
- [SMART_CONTRACTS.md](docs/SMART_CONTRACTS.md) — Solidity contracts, ERC-3643 compliance, Treasury snapshots.
- [AI.md](docs/AI.md) — AI Copilot, RAG architecture, prompt injection protection.
- [API.md](docs/API.md) — Complete REST API specification with request/response schemas.
- [KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) — Honest disclosure of testnet status and dev/prod behaviors.
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Production deployment instructions.
- [INTERVIEW_PREPARATION.md](docs/INTERVIEW_PREPARATION.md) — Technical Q&A guide for project evaluation.
- [DEMO_FLOW.md](docs/DEMO_FLOW.md) — 5-7 minute demonstration script.
