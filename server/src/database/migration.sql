-- ═══════════════════════════════════════════════════════════════════════════════
-- 🚀 AssetChain Production-Grade Supabase PostgreSQL 16+ Database Migration
-- Architecture: Real World Asset (RWA) Tokenization Platform
-- Target Environment: Supabase Production PostgreSQL 16+
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 0. Extensions ───
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─── 1. Custom Enum Types ───
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'asset_owner', 'investor', 'verifier', 'legal_reviewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE wallet_type AS ENUM ('metamask', 'walletconnect', 'coinbase', 'embedded', 'safe_multisig');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE kyc_status AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE compliance_status AS ENUM ('compliant', 'non_compliant', 'flagged_aml', 'pep_review', 'restricted_jurisdiction');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE asset_type AS ENUM (
        'residential_real_estate',
        'commercial_property',
        'agricultural_land',
        'artwork',
        'luxury_collectibles',
        'renewable_energy',
        'commercial_equipment'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'tokenized');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE approval_decision AS ENUM ('approve', 'reject');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE investment_status AS ENUM ('active', 'redeemed', 'transferred', 'locked', 'inherited');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('purchase', 'sale', 'transfer', 'profit_distribution', 'tokenization', 'dao_stake');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('buy', 'sell');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE marketplace_order_status AS ENUM ('active', 'partially_filled', 'completed', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('draft', 'active', 'passed', 'rejected', 'executed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE vote_type AS ENUM ('for', 'against', 'abstain');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'asset_approved',
        'asset_rejected',
        'investment_confirmed',
        'dao_vote_open',
        'profit_distributed',
        'kyc_approved',
        'kyc_rejected',
        'wallet_tx',
        'security_alert'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─── 2. Helper Functions & Triggers ───

-- Automatic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supabase Auth new user signup automatic profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, kyc_status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        'investor',
        'not_submitted'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create auth signup trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── 3. Production Tables (23 Tables) ───

-- 1. Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) UNIQUE,
    wallet_nonce VARCHAR(100),
    wallet_type wallet_type DEFAULT 'metamask',
    wallet_last_login TIMESTAMPTZ,
    role user_role NOT NULL DEFAULT 'investor',
    kyc_status kyc_status NOT NULL DEFAULT 'not_submitted',
    profile_image_url TEXT,
    phone VARCHAR(50),
    country VARCHAR(100),
    is_suspended BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_wallet_format CHECK (wallet_address IS NULL OR wallet_address ~* '^0x[a-fA-F0-9]{40}$')
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP INDEX IF EXISTS public.idx_profiles_email;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

DROP INDEX IF EXISTS public.idx_profiles_wallet;
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles(wallet_address) WHERE wallet_address IS NOT NULL;

DROP INDEX IF EXISTS public.idx_profiles_role;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

DROP INDEX IF EXISTS public.idx_profiles_kyc;
CREATE INDEX IF NOT EXISTS idx_profiles_kyc ON public.profiles(kyc_status);

DROP INDEX IF EXISTS public.idx_profiles_active;
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(id) WHERE deleted_at IS NULL AND is_suspended = FALSE;

-- Backward-compatibility view mapping public.users -> public.profiles
CREATE OR REPLACE VIEW public.users AS SELECT * FROM public.profiles;


-- 2. KYC Documents Table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    ipfs_cid VARCHAR(100),
    encrypted_document_data TEXT,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    verification_status kyc_status NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewer_comments TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

DROP INDEX IF EXISTS public.idx_kyc_docs_user;
CREATE INDEX IF NOT EXISTS idx_kyc_docs_user ON public.kyc_documents(user_id);

DROP INDEX IF EXISTS public.idx_kyc_docs_status;
CREATE INDEX IF NOT EXISTS idx_kyc_docs_status ON public.kyc_documents(verification_status);


-- 3. Compliance Profiles Table (ERC-3643 & AML/PEP Rules)
CREATE TABLE IF NOT EXISTS public.compliance_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    kyc_status kyc_status NOT NULL DEFAULT 'pending',
    compliance_status compliance_status NOT NULL DEFAULT 'compliant',
    risk_score INTEGER NOT NULL DEFAULT 15 CHECK (risk_score BETWEEN 0 AND 100),
    pep_status BOOLEAN DEFAULT FALSE,
    aml_status VARCHAR(50) DEFAULT 'cleared',
    sanctions_cleared BOOLEAN DEFAULT TRUE,
    restricted_jurisdiction BOOLEAN DEFAULT FALSE,
    jurisdiction_code INTEGER DEFAULT 840,
    erc3643_compatible BOOLEAN DEFAULT TRUE,
    compliance_notes TEXT,
    verified_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_compliance_updated_at ON public.compliance_profiles;
CREATE TRIGGER trg_compliance_updated_at BEFORE UPDATE ON public.compliance_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP INDEX IF EXISTS public.idx_compliance_user;
CREATE INDEX IF NOT EXISTS idx_compliance_user ON public.compliance_profiles(user_id);

DROP INDEX IF EXISTS public.idx_compliance_status;
CREATE INDEX IF NOT EXISTS idx_compliance_status ON public.compliance_profiles(compliance_status);


-- 4. Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    asset_type asset_type NOT NULL,
    location VARCHAR(500),
    gps_coordinates VARCHAR(100),
    valuation DECIMAL(18,2) NOT NULL CHECK (valuation > 0),
    currency VARCHAR(10) DEFAULT 'USD',
    token_supply BIGINT NOT NULL CHECK (token_supply > 0),
    token_price DECIMAL(18,6) GENERATED ALWAYS AS (valuation / token_supply) STORED,
    contract_address VARCHAR(42) UNIQUE,
    ipfs_metadata_cid VARCHAR(100),
    verification_status verification_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    tokenized_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_asset_contract_format CHECK (contract_address IS NULL OR contract_address ~* '^0x[a-fA-F0-9]{40}$')
);

DROP TRIGGER IF EXISTS trg_assets_updated_at ON public.assets;
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_assets_owner ON public.assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(verification_status);
CREATE INDEX IF NOT EXISTS idx_assets_contract ON public.assets(contract_address) WHERE contract_address IS NOT NULL;


-- 5. Asset Documents Table
CREATE TABLE IF NOT EXISTS public.asset_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    ipfs_cid VARCHAR(100) NOT NULL,
    encrypted_data TEXT,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_docs_asset ON public.asset_documents(asset_id);


-- 6. Approval Requests Table (Multi-Sig Verifier Workflows)
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL UNIQUE REFERENCES public.assets(id) ON DELETE CASCADE,
    status approval_status NOT NULL DEFAULT 'pending',
    required_votes INTEGER NOT NULL DEFAULT 2,
    approved_count INTEGER NOT NULL DEFAULT 0,
    rejected_count INTEGER NOT NULL DEFAULT 0,
    gnosis_safe_tx_hash VARCHAR(66),
    blockchain_tx_hash VARCHAR(66),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_approval_req_updated_at ON public.approval_requests;
CREATE TRIGGER trg_approval_req_updated_at BEFORE UPDATE ON public.approval_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_approval_req_asset ON public.approval_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_approval_req_status ON public.approval_requests(status);


-- 7. Approval Votes Table
CREATE TABLE IF NOT EXISTS public.approval_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
    verifier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    decision approval_decision NOT NULL,
    comments TEXT,
    digital_signature TEXT,
    verifier_wallet VARCHAR(42),
    blockchain_tx_hash VARCHAR(66),
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_verifier_vote UNIQUE (request_id, verifier_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_votes_req ON public.approval_votes(request_id);


-- 8. Investments Table
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    tokens_owned BIGINT NOT NULL CHECK (tokens_owned >= 0),
    average_buy_price DECIMAL(18,6) NOT NULL CHECK (average_buy_price > 0),
    investment_amount DECIMAL(18,2) NOT NULL CHECK (investment_amount >= 0),
    current_value DECIMAL(18,2) DEFAULT 0.00,
    total_roi_percent DECIMAL(8,4) DEFAULT 0.0000,
    profit_earned DECIMAL(18,2) DEFAULT 0.00,
    status investment_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_asset_investment UNIQUE(user_id, asset_id)
);

DROP TRIGGER IF EXISTS trg_investments_updated_at ON public.investments;
CREATE TRIGGER trg_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_investments_user ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_asset ON public.investments(asset_id);


-- 9. Portfolio Cache Table (Precomputed High-Frequency Read Cache)
CREATE TABLE IF NOT EXISTS public.portfolio_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_invested DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    current_market_value DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_profit_loss DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_roi_percent DECIMAL(8,4) NOT NULL DEFAULT 0.0000,
    active_assets_count INTEGER NOT NULL DEFAULT 0,
    unclaimed_dividends DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_cache_user ON public.portfolio_cache(user_id);


-- 10. Transactions Table (Blockchain On-Chain Records Cache)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(18,2) NOT NULL,
    token_quantity BIGINT NOT NULL,
    token_price DECIMAL(18,6) NOT NULL,
    type transaction_type NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    block_number BIGINT,
    gas_used BIGINT,
    gas_price BIGINT,
    chain_id INTEGER DEFAULT 80002,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_hash ON public.transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_tx_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_asset ON public.transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_tx_status ON public.transactions(status);


-- 11. Blockchain Events Table (Indexer Logs)
CREATE TABLE IF NOT EXISTS public.blockchain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(100) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL DEFAULT 0,
    payload JSONB NOT NULL,
    processed_flag BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_event_log UNIQUE (transaction_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_events_contract ON public.blockchain_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_events_tx ON public.blockchain_events(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_events_unprocessed ON public.blockchain_events(processed_flag) WHERE processed_flag = FALSE;
CREATE INDEX IF NOT EXISTS idx_events_payload_gin ON public.blockchain_events USING GIN (payload);


-- 12. Marketplace Orders Table
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_type order_type NOT NULL DEFAULT 'sell',
    token_amount BIGINT NOT NULL CHECK (token_amount > 0),
    price_per_token DECIMAL(18,6) NOT NULL CHECK (price_per_token > 0),
    total_amount DECIMAL(18,2) GENERATED ALWAYS AS (token_amount * price_per_token) STORED,
    filled_amount BIGINT NOT NULL DEFAULT 0 CHECK (filled_amount <= token_amount),
    status marketplace_order_status NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.marketplace_orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.marketplace_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_orders_asset ON public.marketplace_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.marketplace_orders(status) WHERE status = 'active';


-- 13. Profit Distributions Table (Treasury Yields)
CREATE TABLE IF NOT EXISTS public.profit_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    total_distribution_amount DECIMAL(18,2) NOT NULL CHECK (total_distribution_amount > 0),
    amount_per_token DECIMAL(18,6) NOT NULL,
    snapshot_block_number BIGINT NOT NULL,
    snapshot_timestamp TIMESTAMPTZ NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distributions_asset ON public.profit_distributions(asset_id);


-- 14. DAO Proposals Table
CREATE TABLE IF NOT EXISTS public.dao_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    voting_start_at TIMESTAMPTZ NOT NULL,
    voting_end_at TIMESTAMPTZ NOT NULL CHECK (voting_end_at > voting_start_at),
    status proposal_status NOT NULL DEFAULT 'draft',
    votes_for BIGINT NOT NULL DEFAULT 0,
    votes_against BIGINT NOT NULL DEFAULT 0,
    votes_abstain BIGINT NOT NULL DEFAULT 0,
    quorum_threshold BIGINT NOT NULL,
    execution_data TEXT,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_proposals_updated_at ON public.dao_proposals;
CREATE TRIGGER trg_proposals_updated_at BEFORE UPDATE ON public.dao_proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_proposals_asset ON public.dao_proposals(asset_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.dao_proposals(status);


-- 15. DAO Votes Table
CREATE TABLE IF NOT EXISTS public.dao_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.dao_proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    voter_wallet VARCHAR(42) NOT NULL,
    vote_choice vote_type NOT NULL,
    voting_power BIGINT NOT NULL CHECK (voting_power > 0),
    tx_hash VARCHAR(66),
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_proposal_vote UNIQUE (proposal_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal ON public.dao_votes(proposal_id);


-- 16. Nominees Table (Inheritance Claim System)
CREATE TABLE IF NOT EXISTS public.nominees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    relationship VARCHAR(100) NOT NULL,
    nominee_wallet_address VARCHAR(42) NOT NULL,
    allocation_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (allocation_percentage BETWEEN 0 AND 100),
    government_id_encrypted TEXT NOT NULL,
    encrypted_documents_cid VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_nominees_updated_at ON public.nominees;
CREATE TRIGGER trg_nominees_updated_at BEFORE UPDATE ON public.nominees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_nominees_user ON public.nominees(user_id);


-- 17. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read_status = FALSE;


-- 18. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_details_gin ON public.activity_logs USING GIN (details);


-- 19. Audit Logs Table (Append-Only Security Ledger)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    description TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);


-- 20. AI Assistant Memory Table (Conversations & Vector Embeddings)
CREATE TABLE IF NOT EXISTS public.ai_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    prompt TEXT,
    response TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    embedding_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_user ON public.ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_conversation ON public.ai_memory(conversation_id);


-- 21. Refresh Tokens Table (JWT Session Control)
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON public.refresh_tokens(token_hash);


-- 22. Wallet Sessions Table
CREATE TABLE IF NOT EXISTS public.wallet_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    nonce VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_sessions_address ON public.wallet_sessions(wallet_address);


-- 23. Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_settings_updated_at ON public.platform_settings;
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─── 4. Row Level Security (RLS) Policies on ALL 23 Public Tables ───

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS profile_self_policy ON public.profiles;
CREATE POLICY profile_self_policy ON public.profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. KYC Documents Policies
DROP POLICY IF EXISTS kyc_docs_self_policy ON public.kyc_documents;
CREATE POLICY kyc_docs_self_policy ON public.kyc_documents
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Compliance Profile Policies
DROP POLICY IF EXISTS compliance_self_policy ON public.compliance_profiles;
CREATE POLICY compliance_self_policy ON public.compliance_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Assets Policies (Public read, owner write)
DROP POLICY IF EXISTS assets_public_read ON public.assets;
CREATE POLICY assets_public_read ON public.assets FOR SELECT USING (true);

DROP POLICY IF EXISTS assets_owner_write ON public.assets;
CREATE POLICY assets_owner_write ON public.assets
    FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 5. Investments Policies
DROP POLICY IF EXISTS investment_self_policy ON public.investments;
CREATE POLICY investment_self_policy ON public.investments
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Portfolio Cache Policies
DROP POLICY IF EXISTS portfolio_self_policy ON public.portfolio_cache;
CREATE POLICY portfolio_self_policy ON public.portfolio_cache
    FOR SELECT USING (auth.uid() = user_id);

-- 7. Marketplace Orders Policies (Public read, seller write)
DROP POLICY IF EXISTS marketplace_public_read ON public.marketplace_orders;
CREATE POLICY marketplace_public_read ON public.marketplace_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS marketplace_seller_write ON public.marketplace_orders;
CREATE POLICY marketplace_seller_write ON public.marketplace_orders
    FOR ALL USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

-- 8. DAO Proposals Policies (Public read, creator write)
DROP POLICY IF EXISTS proposals_public_read ON public.dao_proposals;
CREATE POLICY proposals_public_read ON public.dao_proposals FOR SELECT USING (true);

DROP POLICY IF EXISTS proposals_creator_write ON public.dao_proposals;
CREATE POLICY proposals_creator_write ON public.dao_proposals
    FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- 9. DAO Votes Policies
DROP POLICY IF EXISTS dao_votes_self_policy ON public.dao_votes;
CREATE POLICY dao_votes_self_policy ON public.dao_votes
    FOR ALL USING (auth.uid() = voter_id) WITH CHECK (auth.uid() = voter_id);

-- 10. Nominees Policies
DROP POLICY IF EXISTS nominee_self_policy ON public.nominees;
CREATE POLICY nominee_self_policy ON public.nominees
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. Notifications Policies
DROP POLICY IF EXISTS notification_self_policy ON public.notifications;
CREATE POLICY notification_self_policy ON public.notifications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. AI Memory Policies
DROP POLICY IF EXISTS ai_memory_self_policy ON public.ai_memory;
CREATE POLICY ai_memory_self_policy ON public.ai_memory
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 13. Platform Settings Policy (Public read for configurations)
DROP POLICY IF EXISTS platform_settings_read_policy ON public.platform_settings;
CREATE POLICY platform_settings_read_policy ON public.platform_settings
    FOR SELECT TO anon, authenticated USING (true);
