-- ═══════════════════════════════════════════════════════════════
-- AssetChain Database Schema Migration
-- Run this against your Supabase PostgreSQL database
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Custom Enum Types ───

CREATE TYPE user_role AS ENUM ('admin', 'asset_owner', 'investor');
CREATE TYPE kyc_status AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');
CREATE TYPE asset_type AS ENUM (
    'residential_real_estate', 'commercial_property', 'agricultural_land',
    'artwork', 'luxury_collectibles', 'renewable_energy', 'commercial_equipment'
);
CREATE TYPE verification_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'tokenized');
CREATE TYPE tx_type AS ENUM ('purchase', 'sale', 'transfer', 'profit_distribution', 'tokenization');
CREATE TYPE tx_status AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE proposal_status AS ENUM ('draft', 'active', 'passed', 'rejected', 'executed', 'cancelled');
CREATE TYPE vote_type AS ENUM ('for', 'against', 'abstain');
CREATE TYPE notification_type AS ENUM (
    'asset_approved', 'asset_rejected', 'investment_confirmed',
    'dao_vote_open', 'profit_distributed', 'kyc_approved', 'kyc_rejected', 'wallet_tx'
);

-- ─── 2. Users Table ───

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42) UNIQUE,
    role user_role NOT NULL DEFAULT 'investor',
    kyc_status kyc_status NOT NULL DEFAULT 'not_submitted',
    kyc_document_cid TEXT,
    kyc_submitted_at TIMESTAMPTZ,
    kyc_verified_at TIMESTAMPTZ,
    is_suspended BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);

-- ─── 3. Assets Table ───

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    asset_type asset_type NOT NULL,
    location VARCHAR(500),
    valuation DECIMAL(18,2) NOT NULL CHECK (valuation > 0),
    token_supply INTEGER NOT NULL CHECK (token_supply > 0),
    token_price DECIMAL(18,6) GENERATED ALWAYS AS (valuation / token_supply) STORED,
    contract_address VARCHAR(42) UNIQUE,
    ipfs_metadata_cid VARCHAR(100),
    verification_status verification_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    tokenized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_owner ON assets(owner_id);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_status ON assets(verification_status);
CREATE INDEX idx_assets_contract ON assets(contract_address);

-- ─── 4. Asset Documents Table ───

CREATE TABLE asset_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    ipfs_cid VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asset_docs_asset ON asset_documents(asset_id);

-- ─── 5. Investments Table ───

CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tokens_owned INTEGER NOT NULL CHECK (tokens_owned >= 0),
    investment_amount DECIMAL(18,2) NOT NULL,
    average_buy_price DECIMAL(18,6) NOT NULL,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, asset_id)
);

CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_investments_asset ON investments(asset_id);

-- ─── 6. Transactions Table ───

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(18,2) NOT NULL,
    token_quantity INTEGER NOT NULL,
    token_price DECIMAL(18,6) NOT NULL,
    type tx_type NOT NULL,
    status tx_status NOT NULL DEFAULT 'pending',
    block_number INTEGER,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_tx_user ON transactions(user_id);
CREATE INDEX idx_tx_asset ON transactions(asset_id);
CREATE INDEX idx_tx_type ON transactions(type);
CREATE INDEX idx_tx_status ON transactions(status);

-- ─── 7. DAO Proposals Table ───

CREATE TABLE dao_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL CHECK (end_date > start_date),
    status proposal_status NOT NULL DEFAULT 'draft',
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    quorum_threshold INTEGER NOT NULL,
    execution_data TEXT,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_asset ON dao_proposals(asset_id);
CREATE INDEX idx_proposals_status ON dao_proposals(status);

-- ─── 8. Votes Table ───

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES dao_proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote vote_type NOT NULL,
    voting_power INTEGER NOT NULL,
    tx_hash VARCHAR(66),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(proposal_id, voter_id)
);

CREATE INDEX idx_votes_proposal ON votes(proposal_id);
CREATE INDEX idx_votes_voter ON votes(voter_id);

-- ─── 9. Notifications Table ───

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ─── 10. Audit Logs Table ───

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ─── 11. Platform Settings Table ───

CREATE TABLE platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description VARCHAR(500),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ─── 12. Auto-Update Triggers for updated_at ───

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
    BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON dao_proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 13. Seed Default Admin ───

-- Note: Replace the password hash with a bcrypt hash of your desired admin password
-- The hash below is for the password "Admin@123456"
INSERT INTO users (full_name, email, password_hash, role, kyc_status)
VALUES (
    'Platform Admin',
    'admin@assetchain.io',
    '$2a$12$LJ3L5rCqN1YUkYcI0w0Z7.mYGK8BN0S9X4SJwBw3LQqtfB6K4IzWO',
    'admin',
    'approved'
);

-- Seed platform settings
INSERT INTO platform_settings (key, value, description) VALUES
    ('platform_fee_percent', '250', 'Platform fee in basis points (250 = 2.5%)'),
    ('min_investment_amount', '10', 'Minimum investment amount in USD'),
    ('max_token_supply', '10000000', 'Maximum token supply per asset'),
    ('kyc_required', 'true', 'Whether KYC is required for transactions'),
    ('maintenance_mode', 'false', 'Whether the platform is in maintenance mode');
