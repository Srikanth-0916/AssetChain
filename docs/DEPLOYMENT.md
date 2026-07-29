# TrustChain AI — Production Deployment Guide

> **Recommended Production Stack:** Vercel (Client) · Railway/Render (Server) · Supabase (Database) · Polygon Amoy (Smart Contracts)

---

## 1. Prerequisites & Preparation

1. **Node.js:** v18.0.0 or higher
2. **Git Repository:** Forked / cloned codebase
3. **Environment Secrets:**
   - `GEMINI_API_KEY`: Google Gemini API Key ([aistudio.google.com](https://aistudio.google.com))
   - `JWT_SECRET`: Secret string (at least 32 characters)
   - `DOCUMENT_ENCRYPTION_KEY`: 32-character encryption key for AES-256-GCM
   - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Supabase project credentials
   - `POLYGON_AMOY_RPC_URL`: `https://rpc-amoy.polygon.technology`

---

## 2. Frontend Deployment (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variables:
   - `VITE_API_URL`: Your deployed backend API URL (e.g. `https://assetchain-api.up.railway.app/api/v1`)
   - `VITE_POLYGON_AMOY_CHAIN_ID`: `80002`
   - `VITE_POLYGON_AMOY_RPC_URL`: `https://rpc-amoy.polygon.technology`
5. Click **Deploy**.

---

## 3. Backend API Deployment (Railway / Render)

1. Create a new service on [Railway](https://railway.app) or [Render](https://render.com).
2. Set **Root Directory** to `server`.
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run start`
5. Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3001`
   - `JWT_SECRET`: `<32_char_secret>`
   - `DOCUMENT_ENCRYPTION_KEY`: `<32_char_encryption_key>`
   - `GEMINI_API_KEY`: `<your_gemini_key>`
   - `SUPABASE_URL`: `<your_supabase_url>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<your_supabase_service_key>`

---

## 4. Smart Contract Deployment (Polygon Amoy Testnet)

```bash
cd contracts
npm install

# Fund deployer wallet with MATIC via https://faucet.polygon.technology
npx hardhat run scripts/deploy.ts --network amoy
```

Copy deployed contract addresses into `client/src/config/contracts.ts`.

---

## 5. Post-Deployment Verification

1. Test Public Health Check:
   ```bash
   curl https://your-backend-domain.com/api/v1/system/health
   ```
   Verify status returns `"healthy"` with valid uptime.

2. Verify Frontend Navigation:
   - `/security` → Security Center & System Health Card
   - `/privacy` → Privacy Center & Reviewer Access History
