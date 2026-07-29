# TrustChain AI — Known Limitations & Production Readiness

> This document honestly outlines current platform limitations, development behaviors, and production readiness requirements.

---

## Data Persistence & Fail-Close Behavior

- **Development Mode (`NODE_ENV=development`):** Database connection errors trigger a warning log and fall back to in-memory stores so local development and automated unit tests run without external database dependencies.
- **Production Mode (`NODE_ENV=production`):** Database connection errors throw a `ServiceUnavailableError` (HTTP 503) and log a critical audit event. The system **fails close** and never silently falls back to in-memory storage.
- **Supabase PostgreSQL Tables:** Required in production for `audit_logs`, `approval_requests`, `compliance_profiles`, `nominees`, `notifications`, and `ai_memory`.

---

## Data Security & Encryption

- **Document Encryption:** All sensitive files and PII fields (Government IDs, Nominee details, KYC documents, Probate documents, Death certificates) are encrypted using **AES-256-GCM (Authenticated Encryption)** with 96-bit random IVs and 128-bit authentication tags.
- **IPFS Storage:** Property title deeds stored on IPFS are content-addressed and publicly readable via standard IPFS gateways. Sensitive documents are stored encrypted in Supabase rather than on IPFS.

---

## Payments & Blockchain

- **Razorpay Payments:** Operating in **Sandbox Test Mode** (`RAZORPAY_KEY_ID` configured for test mode). No live fiat INR transactions are processed.
- **Polygon Amoy Testnet:** Deployed on Polygon Amoy testnet (Chain ID 80002). Smart contracts have **NOT** been audited by an independent security firm for mainnet launch.
- **Multi-Sig Consensus:** Enforced via 2-of-3 backend policy engine (`verifier`, `legal_reviewer`, `admin`). Gnosis Safe adapter interface is integrated; full on-chain Safe contract deployment is pending.

---

## AI & Intelligence Engine

- **Gemini 2.0 Flash:** Integrates Gemini 2.0 Flash for natural language copilot, document fraud analysis, and investment recommendations.
- **Quota & Fallback:** Free-tier API rate limits apply (~15 RPM / 1M TPM). If the Gemini API rate limit is exceeded, the platform seamlessly falls back to pre-calculated deterministic scoring without inventing financial figures.
- **Prompt Injection Defense:** `PromptSanitizer` scans OCR extracted text for 18 injection pattern categories before submitting content to Gemini. Detected injections add +30 to the asset fraud score and require manual review.
