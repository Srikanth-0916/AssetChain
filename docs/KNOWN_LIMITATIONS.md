# TrustChain AI — Known Limitations & Production Readiness

> **Official Presentation Position:**  
> *"TrustChain AI is a production-oriented enterprise prototype. Core workflows are implemented and validated on Polygon Amoy Testnet with live backend integration. External services such as commercial KYC providers, government land registries, and payment gateways are abstracted behind provider interfaces, allowing seamless replacement of mock adapters with live integrations for production deployment."*

---

## 🔌 Integration Architecture Status Matrix (Live vs Sandbox vs Adapter)

| Component / Subsystem | Integration Pattern | Live Environment Status | Fallback / Production Requirement |
|---|---|---|---|
| **Smart Contracts** | On-Chain EVM Deployment | **Live on Polygon Amoy Testnet (Chain ID 80002)** | Requires independent 3rd-party security audit (CertiK/OpenZeppelin) for Mainnet. |
| **Gemini AI Copilot** | Live REST API | **Live Gemini 2.0 Flash (`GEMINI_API_KEY`)** | 30s short-circuit backoff + pre-calculated deterministic math fallback on HTTP 429 rate limit. |
| **Razorpay Payments** | Sandbox Payment Gateway | **Live Sandbox Test Mode (`RAZORPAY_KEY_ID`)** | Requires merchant account KYC verification for Live Fiat INR production transactions. |
| **Pinata IPFS Pinning** | Gateway API | **Live Pinata IPFS Gateway** | Uses mock CID generator when API key is unconfigured. |
| **Real-Time Push** | WebSockets | **Live WebSocket Event Server (`/ws`)** | Pushes instant live events for dividends, fraud alerts, and purchases without polling. |
| **Identity & KYC Engine** | Provider Adapter Pattern | **HyperVerge / Signzy / Onfido Adapter Interface** | Runs in sandbox verification mode; production requires paid API keys & G2C gateway access. |
| **State Land Registry** | Registry Sandbox Adapter | **Bhulekh / IGRS Schema Validation Adapter** | Runs in sandbox verification mode; state land records (Bhulekh/AnyROR) lack open G2C APIs. |
| **Data Persistence** | Dual-Mode Fail-Close | **Supabase PostgreSQL / Local Memory Fallback** | Production (`NODE_ENV=production`) strictly **fails close** (HTTP 503) on DB errors. |

---

## Data Security & Encryption

- **Document Encryption:** All sensitive files and PII fields (Government IDs, Nominee details, KYC documents, Probate documents, Death certificates) are encrypted using **AES-256-GCM (Authenticated Encryption)** with 96-bit random IVs and 128-bit authentication tags.
- **IPFS Storage:** Property title deeds stored on IPFS are content-addressed and publicly readable via standard IPFS gateways. Sensitive documents are stored encrypted in Supabase rather than on IPFS.

---

## Payments & Blockchain

- **Razorpay Payments:** Operating in **Sandbox Test Mode** (`RAZORPAY_KEY_ID` configured for test mode). No live fiat INR transactions are processed.
- **Polygon Amoy Testnet:** Deployed on Polygon Amoy testnet (Chain ID 80002). Smart contracts have **NOT** been audited by an independent security firm for mainnet launch.
- **Multi-Sig Consensus:** Enforced via 2-of-3 backend policy engine (`verifier`, `legal_reviewer`, `admin`). By default (when `GNOSIS_SAFE_ADDRESS` is not configured), the platform operates in Off-Chain Policy Engine Mode for approvals.

---

## AI & Intelligence Engine

- **Gemini 2.0 Flash:** Integrates Gemini 2.0 Flash for natural language copilot, document fraud analysis, and investment recommendations.
- **Quota & Fallback:** Free-tier API rate limits apply (~15 RPM / 1M TPM). If the Gemini API rate limit is exceeded, the platform seamlessly falls back to pre-calculated deterministic scoring without inventing financial figures.
- **Prompt Injection Defense:** `PromptSanitizer` scans OCR extracted text for 18 injection pattern categories before submitting content to Gemini. Detected injections add +30 to the asset fraud score and require manual review.
