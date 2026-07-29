# TrustChain AI — REST API Documentation

> **Version:** 2.0.0  
> **Base URL:** `/api/v1`  
> **Auth Header:** `Authorization: Bearer <jwt_token>`

---

## Overview & Status Codes

All API endpoints return JSON. Standardized HTTP status codes:

- `200 OK`: Request succeeded.
- `201 Created`: Resource created.
- `400 Bad Request`: Validation failure (Zod error details returned).
- `401 Unauthorized`: Missing or invalid JWT / EIP-191 signature.
- `403 Forbidden`: Insufficient role permissions (`admin`, `asset_owner`, `investor`).
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded (20 req / 15 min).
- `503 Service Unavailable`: Production persistence store error (Fail-Close mode).

---

## Endpoints Summary

### System & Health

#### `GET /api/v1/system/health`
- **Auth:** Public
- **Response:**
  ```json
  {
    "gemini": "healthy",
    "polygon": "connected",
    "supabase": "healthy",
    "payments": "sandbox",
    "contracts": "verified",
    "recommendationEngine": "healthy",
    "ai": "healthy",
    "uptime": "1d 4h 12m",
    "latency": "12ms",
    "timestamp": "2026-07-29T16:30:00.000Z"
  }
  ```

---

### Auth (`/api/v1/auth`)

#### `POST /api/v1/auth/nonce`
- **Body:** `{ "walletAddress": "0x1234..." }`
- **Response:** `{ "nonce": "Sign this message to authenticate..." }`

#### `POST /api/v1/auth/verify`
- **Body:** `{ "walletAddress": "0x1234...", "signature": "0x..." }`
- **Response:** `{ "token": "jwt...", "user": { ... } }`

---

### Assets (`/api/v1/assets`)

#### `GET /api/v1/assets`
- **Query Params:** `status` (`pending`, `approved`, `tokenized`), `type`, `page`, `limit`
- **Response:** Array of asset objects.

#### `POST /api/v1/assets`
- **Auth:** Required (`asset_owner` or `admin`)
- **Body:** `{ "title": "...", "valuation": 1000000, "tokenPrice": 100, ... }`
- **Trigger:** Automatic OCR text extraction & `PromptSanitizer` fraud analysis.

---

### Trust Engine (`/api/v1/trust`)

#### `GET /api/v1/trust/:assetId`
- **Auth:** Public
- **Response:** 0-100 Trust Score report with component breakdown and verification timeline.

---

### AI Copilot (`/api/v1/ai`)

#### `POST /api/v1/ai/chat`
- **Body:** `{ "message": "Recommend assets for $50,000 budget" }`
- **Response:** Gemini AI response with memory context & deterministic scores.

---

### AI Recommendations (`/api/v1/recommendation`)

#### `POST /api/v1/recommendation/generate`
- **Body:** `{ "budget": 50000, "currency": "INR", "riskPreference": "medium" }`
- **Response:** Deterministic asset scoring, allocation math, `scoreBreakdown`, `reasons[]`, `warnings[]`, `alternativeAssets[]`.

---

### Compliance (`/api/v1/compliance`)

#### `GET /api/v1/compliance/profile/:userId`
- **Auth:** Required
- **Response:** ERC-3643 compliance profile, KYC status code, jurisdiction numeric code, transfer permission.

---

### Multi-Sig Approval (`/api/v1/approval`)

#### `POST /api/v1/approval/vote`
- **Auth:** Required (`verifier`, `legal_reviewer`, `admin`)
- **Body:** `{ "requestId": "...", "role": "verifier", "decision": "approved", "comments": "..." }`
- **Behavior:** Enforces 2-of-3 policy before status changes to `approved`.
