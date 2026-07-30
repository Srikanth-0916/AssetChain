-- ════════════════════════════════════════════════════════════════
-- AssetChain — Supabase Schema Fix & Cache Reload Patch
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query
-- This permanently adds all columns the code expects.
-- ════════════════════════════════════════════════════════════════

-- ── 1. ai_memory: add missing columns ────────────────────────────────────────
ALTER TABLE public.ai_memory
  ADD COLUMN IF NOT EXISTS data          JSONB       DEFAULT '{}'::jsonb;

ALTER TABLE public.ai_memory
  ADD COLUMN IF NOT EXISTS timestamp     TIMESTAMPTZ DEFAULT NOW();

-- ── 2. audit_logs: add missing columns ───────────────────────────────────────
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS description   TEXT;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS entity_id     VARCHAR(255);

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS new_value     JSONB;

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS old_value     JSONB;

-- ── 3. compliance_profiles: add missing columns ───────────────────────────────
ALTER TABLE public.compliance_profiles
  ADD COLUMN IF NOT EXISTS erc3643_compatible BOOLEAN DEFAULT TRUE;

-- ── 4. nominees: add missing columns ─────────────────────────────────────────
ALTER TABLE public.nominees
  ADD COLUMN IF NOT EXISTS government_id TEXT;  -- stores AES-256-GCM encrypted value

-- ── 5. approval_requests: add missing columns ─────────────────────────────────
ALTER TABLE public.approval_requests
  ADD COLUMN IF NOT EXISTS asset_title          VARCHAR(255);

ALTER TABLE public.approval_requests
  ADD COLUMN IF NOT EXISTS total_roles          INTEGER DEFAULT 3;

ALTER TABLE public.approval_requests
  ADD COLUMN IF NOT EXISTS verification_summary JSONB;

-- ── 6. Force PostgREST schema cache reload ────────────────────────────────────
-- Critical: without this, API continues to use stale column list
NOTIFY pgrst, 'reload schema';

-- ── 7. Verify all expected columns now exist ──────────────────────────────────
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE
  table_schema = 'public'
  AND table_name IN ('ai_memory', 'audit_logs', 'compliance_profiles', 'nominees', 'approval_requests')
ORDER BY table_name, ordinal_position;
