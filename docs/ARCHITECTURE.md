# TrustChain AI — Technical Architecture Specification

> **Version:** 2.0.0 (Hardened Prototype)  
> **Platform:** Polygon Amoy Testnet · Express 5 TypeScript API · React 18 Client

---

## 1. System Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Client (React 18 + Vite)                              │
│                                                                                 │
│  Pages: Landing · Dashboard · Marketplace · Portfolio · AI Copilot · Analytics  │
│         Privacy Center · Security Center · Admin Panel                          │
│  Components: MoneyFlowTracker · TrustSignalCard · SystemHealthCard              │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │ REST / JSON (JWT + EIP-191 Auth)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Backend API Server (Express 5 + TypeScript)                  │
│                                                                                 │
│  Core Controllers & Middleware:                                                 │
│   ├── Auth (JWT + EIP-191 Multi-Wallet Nonce Verification & Replay Protection)  │
│   ├── Web3 Multi-Wallet Layer (MetaMask, Coinbase, Rabby, Trust, Rainbow, WC v2)│
│   ├── Rate Limiting (20 req/15min) & Helmet Security Headers                    │
│   └── System Health Endpoint (`GET /api/v1/system/health`)                      │

│                                                                                 │
│  Intelligence & Verification Layer:                                             │
│   ├── PromptSanitizer (`prompt.sanitizer.ts`) — 18 Injection Patterns           │
│   ├── Gemini 2.0 Flash Integration (Copilot + OCR Fraud Analysis)               │
│   ├── Deterministic Recommendation Engine (`recommendation.engine.ts`)          │
│   ├── Deterministic Trust Score Engine (`trust.service.ts`)                     │
│   └── AI Observability Subsystem (`ai.observability.ts`)                        │
│                                                                                 │
│  Compliance & Administrative Services:                                          │
│   ├── Multi-Sig Approval Workflow (`approval.service.ts` — 2-of-3 Gnosis Safe)  │
│   ├── Compliance Engine (`compliance.service.ts` — ERC-3643 Whitelist & KYC)   │
│   ├── SPV Registry (`spv.service.ts` — Special Purpose Vehicle legal entity)    │
│   ├── Nominee & Inheritance Engine (`nominee.service.ts` — Proof Verification) │
│   └── Audit Logging Service (`audit.service.ts` — Async Write-Through)          │
│                                                                                 │
│  Data & Document Security Utilities:                                            │
│   └── Encryption Utility (`encryption.ts` — AES-256-GCM Authenticated Enc.)     │
└───────────────────────┬───────────────────────────────┬─────────────────────────┘
                        │                               │
            Supabase DB │                               │ ethers.js v6
       (PostgreSQL RLS) │                               │ RPC Provider
                        ▼                               ▼
┌───────────────────────────────┐     ┌───────────────────────────────────────────┐
│    Persistent Storage Layer   │     │    Polygon Amoy Smart Contracts           │
│                               │     │                                           │
│  - `audit_logs`               │     │  - `AssetToken.sol` (ERC-20 + Whitelist) │
│  - `approval_requests`        │     │  - `AssetTokenFactory.sol`                │
│  - `compliance_profiles`      │     │  - `AssetRegistry.sol` (Lifecycle)        │
│  - `nominees`                 │     │  - `Marketplace.sol` (P2P + Primary)      │
│  - `notifications`            │     │  - `Governance.sol` (DAO Voting)          │
│  - `ai_memory`                │     │  - `Treasury.sol` (Pull-Based Dividends)  │
└───────────────────────────────┘     └───────────────────────────────────────────┘
```

---

## 2. Security Architecture

### Authenticated Document Encryption (AES-256-GCM)
Sensitive documents and PII fields are encrypted using **AES-256-GCM** prior to persistence:
- **Algorithm:** `aes-256-gcm`
- **Key Derivation:** SHA-256 derived from `DOCUMENT_ENCRYPTION_KEY` or `JWT_SECRET`
- **IV Length:** 12 bytes (96-bit random IV per file)
- **Auth Tag:** 16-byte GCM authentication tag stored alongside ciphertext
- **Backward Compatibility:** `decryptDocument()` automatically detects legacy `aes-256-cbc` records and decrypts seamlessly.

### Prompt Injection Defense Pipeline
Document text extracted during OCR analysis passes through `PromptSanitizer`:
1. Strips zero-width and invisible control Unicode characters (`\u200B`, `\u200C`, Bidi overrides).
2. Scans against 18 regex patterns (`"ignore previous instructions"`, `"fraud score = 0"`, `"you are now"`).
3. Redacts suspicious instructions with `[REDACTED:INSTRUCTION_OVERRIDE]`.
4. Detected injections automatically escalate fraud score by **+30 points**, force **Manual Review**, and write a `critical` audit log.

---

## 3. Persistence Model: Fail-Close (Prod) vs Fail-Open (Dev)

| Mode | Environment Condition | Behavior on Database Error | HTTP Response |
|------|----------------------|----------------------------|---------------|
| **Development** | `NODE_ENV === 'development'` | Log warning, use in-memory store fallback, keep UI operational | HTTP 200 (Success) |
| **Production** | `NODE_ENV === 'production'` | Reject operation, log critical audit error, **never** silently fall back to memory | HTTP 503 (`ServiceUnavailableError`) |

---

## 4. Payment & Investment Pipeline

```
[ Investor ] ──(1. Payment Initiated)──> [ Razorpay Sandbox ]
                                                │
                                       (2. HMAC Signature Verified)
                                                │
                                                ▼
[ Portfolio ] <──(6. ERC-20 Mint)─── [ AssetToken.sol ] <──(5. Contract Exec)─── [ Treasury.sol ] <──(3. USDC Deposit)
                                                ▲
                                                │
                                    (4. 2-of-3 Multi-Sig Approval)
```

---

## 5. Verification Status

- **Vitest Backend Test Suite:** 35 / 35 tests passing
- **Hardhat Smart Contract Test Suite:** 12 / 12 tests passing
