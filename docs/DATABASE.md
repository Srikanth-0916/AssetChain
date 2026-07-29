# TrustChain AI — Database & Persistence Specification

> **Database Engine:** Supabase PostgreSQL  
> **Persistence Strategy:** Dual-Write (In-Memory LRU + Async DB Write-Through)

---

## Environment-Based Fail-Close Strategy

```
                          ┌───────────────────────────┐
                          │ Database Persistence Call │
                          └─────────────┬─────────────┘
                                        │
                         Is Supabase Available?
                               /         \
                             YES          NO
                             /             \
                   ┌──────────────┐   ┌──────────────────────────────┐
                   │ Write to DB  │   │ Check `env.NODE_ENV`         │
                   └──────────────┘   └──────────────┬───────────────┘
                                                     │
                                       ┌─────────────┴─────────────┐
                                       │                           │
                                `development`                 `production`
                                       │                           │
                        ┌──────────────────────────────┐   ┌──────────────────────────────┐
                        │ - Log warning in console     │   │ - Throw 503 ServiceUnavail.  │
                        │ - Serve from memory store    │   │ - Log critical audit alert   │
                        │ - Keep UI 100% operational   │   │ - NEVER silently use memory  │
                        └──────────────────────────────┘   └──────────────────────────────┘
```

---

## Database Schemas & Tables

### 1. `audit_logs`
- `id` (UUID, Primary Key)
- `type` (VARCHAR) — `admin_action`, `kyc_approved`, `asset_tokenized`, `security_alert`
- `actor_id` (VARCHAR)
- `actor_role` (VARCHAR)
- `description` (TEXT)
- `metadata` (JSONB)
- `severity` (VARCHAR) — `info`, `warning`, `critical`
- `timestamp` (TIMESTAMPTZ)

### 2. `approval_requests`
- `id` (UUID, Primary Key)
- `asset_id` (VARCHAR, Indexed)
- `asset_title` (TEXT)
- `status` (VARCHAR) — `pending`, `approved`, `rejected`
- `required_votes` (INT) — Default 2
- `total_roles` (INT) — Default 3
- `approved_count` (INT)
- `rejected_count` (INT)
- `gnosis_safe_tx_hash` (VARCHAR)
- `verification_summary` (JSONB)

### 3. `compliance_profiles`
- `user_id` (VARCHAR, Primary Key)
- `wallet_address` (VARCHAR, Indexed)
- `kyc_status` (VARCHAR) — `unverified`, `pending`, `approved`, `revoked`
- `kyc_status_code` (INT) — `0=Unverified`, `1=Approved`, `2=Revoked`
- `jurisdiction` (VARCHAR)
- `jurisdiction_code` (INT) — ISO numeric code
- `risk_tier` (VARCHAR)
- `risk_tier_code` (INT)
- `transfer_permission` (BOOLEAN)
- `is_whitelisted` (BOOLEAN)
- `erc3643_compatible` (BOOLEAN)
- `updated_at` (TIMESTAMPTZ)

### 4. `nominees`
- `id` (UUID, Primary Key)
- `user_id` (VARCHAR, Foreign Key -> users)
- `full_name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `government_id` (TEXT) — **AES-256-GCM Encrypted JSON**
- `relationship` (TEXT)
- `nominee_wallet_address` (VARCHAR)
- `allocation_percentage` (NUMERIC)
- `status` (VARCHAR)

### 5. `notifications`
- `id` (UUID, Primary Key)
- `user_id` (VARCHAR, Indexed)
- `type` (VARCHAR)
- `title` (TEXT)
- `message` (TEXT)
- `read` (BOOLEAN)
- `data` (JSONB)
- `created_at` (TIMESTAMPTZ)

### 6. `ai_memory`
- `id` (UUID, Primary Key)
- `user_id` (VARCHAR, Indexed)
- `role` (VARCHAR) — `user`, `assistant`, `system`
- `content` (TEXT)
- `data` (JSONB)
- `timestamp` (TIMESTAMPTZ)

---

## ⚡ PostgreSQL Performance Indexes (Phase 2 Optimization)

```sql
-- Compliance Profiles composite lookup index
CREATE INDEX IF NOT EXISTS idx_compliance_user_wallet ON compliance_profiles(user_id, LOWER(wallet_address));

-- Approval Requests lookup index by asset and status
CREATE INDEX IF NOT EXISTS idx_approval_asset_status ON approval_requests(asset_id, status);

-- Nominees user lookup index
CREATE INDEX IF NOT EXISTS idx_nominees_user_id ON nominees(user_id);

-- Audit Logs timestamp ordering index
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- AI Memory user conversation index
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_time ON ai_memory(user_id, timestamp DESC);
```
