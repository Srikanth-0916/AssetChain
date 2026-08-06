-- ═══════════════════════════════════════════════════════════════════════════
-- AssetChain Investment Blockchain Migration (v2 - Granular Transactions)
-- Adds confirmation_status enum, blockchain_transactions table, and
-- extends investments table with full contract metadata.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Add confirmation_status to investments ──────────────────────────────

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS transaction_hash   VARCHAR(66)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS block_number       BIGINT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wallet_address     VARCHAR(42)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contract_address   VARCHAR(42)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gas_used           BIGINT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS network            VARCHAR(30)   DEFAULT 'polygon-amoy',
  ADD COLUMN IF NOT EXISTS polygonscan_url    TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(20)  DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS confirmed_at       TIMESTAMPTZ   DEFAULT NULL;

-- Create check constraint for confirmation_status enum values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_investments_confirmation_status'
  ) THEN
    ALTER TABLE public.investments
      ADD CONSTRAINT chk_investments_confirmation_status
      CHECK (confirmation_status IN ('Pending', 'Confirmed', 'Failed', 'Reverted'));
  END IF;
END $$;

-- ─── 2. Dedicated blockchain_transactions Table ─────────────────────────────
-- Keeps investments clean while providing an audit trail for every on-chain interaction

CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id     UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_id          UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  wallet_address    VARCHAR(42) NOT NULL,
  contract_address  VARCHAR(42) NOT NULL,
  tx_hash           VARCHAR(66) NOT NULL UNIQUE,
  block_number      BIGINT,
  gas_used          BIGINT,
  gas_price         BIGINT,
  amount_wei        NUMERIC,
  amount_usd        NUMERIC(15, 2),
  quantity          NUMERIC,
  network           VARCHAR(30) DEFAULT 'polygon-amoy',
  chain_id          INTEGER DEFAULT 80002,
  status            VARCHAR(20) DEFAULT 'Pending',
  polygonscan_url   TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at      TIMESTAMPTZ,
  
  CONSTRAINT chk_tx_status CHECK (status IN ('Pending', 'Confirmed', 'Failed', 'Reverted'))
);

-- Indexes for performance & auditing
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON public.blockchain_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_user ON public.blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_asset ON public.blockchain_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON public.blockchain_transactions(status);

-- ─── 3. Add wallet_address to profiles if missing ───────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_wallet
  ON public.profiles(wallet_address)
  WHERE wallet_address IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE public.blockchain_transactions IS
  'Auditable store of all on-chain settlement transactions for asset investments';

COMMENT ON COLUMN public.investments.confirmation_status IS
  'Current on-chain verification state: Pending | Confirmed | Failed | Reverted';
