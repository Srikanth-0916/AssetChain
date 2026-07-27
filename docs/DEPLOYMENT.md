# TrustChain AI — Deployment Guide

## Architecture

```
Client (Vercel)  →  API (Railway)  →  Redis (Redis Cloud)
                              ↓
                 Polygon Amoy (Blockchain)
                 IPFS via Pinata
                 Gemini AI
                 Razorpay Payments
```

---

## Option A — Railway (Recommended for Backend)

### 1. Create Railway project
1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Select your repository

### 2. Add Redis service
In Railway dashboard: "+ New" → "Redis"

### 3. Set environment variables in Railway
```env
NODE_ENV=production
PORT=3001
APP_VERSION=2.0.0
JWT_SECRET=<32+ character random string>
GEMINI_API_KEY=<from aistudio.google.com/apikey>
RAZORPAY_KEY_ID=<from razorpay.com>
RAZORPAY_KEY_SECRET=<from razorpay.com>
REDIS_URL=<auto-filled by Railway Redis plugin>
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
PINATA_API_KEY=<from pinata.cloud>
PINATA_SECRET_KEY=<from pinata.cloud>
DATABASE_URL=<optional — leave empty for in-memory mode>
```

### 4. Set Railway root directory
In Railway settings: Root Directory = `server`

### 5. Set build command
```
npm run build
```

### 6. Set start command
```
npm start
```

---

## Option B — Docker (Self-hosted / VPS)

```bash
# Copy and fill environment variables
cp server/.env.example server/.env
nano server/.env

# Build and run
docker compose up -d --build

# Check health
curl http://localhost:3001/api/v1/health
```

---

## Frontend Deployment (Vercel)

### 1. Push to GitHub

### 2. Import on Vercel
1. Go to [vercel.com](https://vercel.com)
2. "New Project" → Import from GitHub
3. Root directory: `client`
4. Build command: `npm run build`
5. Output directory: `dist`

### 3. Set environment variables on Vercel
```env
VITE_API_URL=https://your-railway-app.up.railway.app/api/v1
VITE_POLYGON_AMOY_CHAIN_ID=80002
VITE_RAZORPAY_KEY_ID=rzp_test_xxx (your Razorpay test key)
```

### 4. Update vercel.json
Replace `your-railway-app.up.railway.app` with your actual Railway URL.

---

## Smart Contract Deployment

Contracts are already deployed on Polygon Amoy. To redeploy:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network amoy
```

Update contract addresses in `client/src/config/contracts.ts`.

---

## DNS & CORS

After deployment, update:
- `server/.env` → `CORS_ORIGIN=https://your-vercel-app.vercel.app`
- `server/.env` → `CLIENT_URL=https://your-vercel-app.vercel.app`

---

## Verification

1. Frontend: Visit your Vercel URL
2. Backend: `GET https://your-railway-app.up.railway.app/api/v1/health`
3. AI: Check `integrations.gemini` field in health response
4. Payments: Razorpay test mode — use card `4111 1111 1111 1111`

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@trustchain.ai` | `Admin@123` |
| Asset Owner | `owner@trustchain.ai` | `Owner@123` |
| Investor | `investor@trustchain.ai` | `Investor@123` |
