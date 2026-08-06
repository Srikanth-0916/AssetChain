-- ═══════════════════════════════════════════════════════════════════════════════
-- 🚀 Supabase Storage RLS Security Policies for AssetChain RWA Platform
-- Target Table: storage.objects
-- Role Verification: public.profiles (role column)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 0. Security Definer Role Lookup Function ───
-- Includes search_path hardening and COALESCE fallback to prevent NULL evaluation
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'investor'::public.user_role
  );
$$;


-- ───────────────────────────────────────────────────────────────────────────────
-- 1. Bucket: avatars
-- ───────────────────────────────────────────────────────────────────────────────

-- Authenticated Users: Read all avatars
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
CREATE POLICY "avatars_select_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

-- Authenticated Users: Upload own avatar (path must start with user_id)
DROP POLICY IF EXISTS "avatars_insert_own_policy" ON storage.objects;
CREATE POLICY "avatars_insert_own_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated Users: Update/Replace own avatar
DROP POLICY IF EXISTS "avatars_update_own_policy" ON storage.objects;
CREATE POLICY "avatars_update_own_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated Users: Delete own avatar
DROP POLICY IF EXISTS "avatars_delete_own_policy" ON storage.objects;
CREATE POLICY "avatars_delete_own_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin: Full Access to avatars
DROP POLICY IF EXISTS "avatars_admin_full_policy" ON storage.objects;
CREATE POLICY "avatars_admin_full_policy" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'avatars' AND
    public.get_auth_user_role() = 'admin'
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    public.get_auth_user_role() = 'admin'
  );


-- ───────────────────────────────────────────────────────────────────────────────
-- 2. Bucket: property-images
-- ───────────────────────────────────────────────────────────────────────────────

-- Asset Owner: Upload property images
DROP POLICY IF EXISTS "property_images_insert_owner" ON storage.objects;
CREATE POLICY "property_images_insert_owner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-images' AND
    public.get_auth_user_role() = 'asset_owner' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Asset Owner: Update/Replace own property images
DROP POLICY IF EXISTS "property_images_update_owner" ON storage.objects;
CREATE POLICY "property_images_update_owner" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-images' AND
    public.get_auth_user_role() = 'asset_owner' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'property-images' AND
    public.get_auth_user_role() = 'asset_owner' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Asset Owner: Delete own property images
DROP POLICY IF EXISTS "property_images_delete_owner" ON storage.objects;
CREATE POLICY "property_images_delete_owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-images' AND
    public.get_auth_user_role() = 'asset_owner' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read access for Investor, Verifier, Legal Reviewer, Admin, Asset Owner
DROP POLICY IF EXISTS "property_images_read_roles" ON storage.objects;
CREATE POLICY "property_images_read_roles" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'property-images' AND
    public.get_auth_user_role() IN ('asset_owner', 'investor', 'verifier', 'legal_reviewer', 'admin')
  );

-- Admin: Full Access to property-images
DROP POLICY IF EXISTS "property_images_admin_full" ON storage.objects;
CREATE POLICY "property_images_admin_full" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'property-images' AND
    public.get_auth_user_role() = 'admin'
  )
  WITH CHECK (
    bucket_id = 'property-images' AND
    public.get_auth_user_role() = 'admin'
  );


-- ───────────────────────────────────────────────────────────────────────────────
-- 3. Bucket: asset-documents
-- ───────────────────────────────────────────────────────────────────────────────

-- Asset Owner: Upload asset documents
DROP POLICY IF EXISTS "asset_docs_insert_owner" ON storage.objects;
CREATE POLICY "asset_docs_insert_owner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'asset-documents' AND
    public.get_auth_user_role() = 'asset_owner' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read access for Verifier, Legal Reviewer, Admin, and Document Owner
DROP POLICY IF EXISTS "asset_docs_read_authorized" ON storage.objects;
CREATE POLICY "asset_docs_read_authorized" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'asset-documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.get_auth_user_role() IN ('verifier', 'legal_reviewer', 'admin')
    )
  );

-- Admin: Full Access to asset-documents
DROP POLICY IF EXISTS "asset_docs_admin_full" ON storage.objects;
CREATE POLICY "asset_docs_admin_full" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'asset-documents' AND
    public.get_auth_user_role() = 'admin'
  )
  WITH CHECK (
    bucket_id = 'asset-documents' AND
    public.get_auth_user_role() = 'admin'
  );


-- ───────────────────────────────────────────────────────────────────────────────
-- 4. Bucket: user-documents
-- ───────────────────────────────────────────────────────────────────────────────

-- Authenticated User: Upload own KYC documents
DROP POLICY IF EXISTS "user_docs_insert_self" ON storage.objects;
CREATE POLICY "user_docs_insert_self" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated User: Read own KYC documents or Admin/Verifier/Legal Reviewer
DROP POLICY IF EXISTS "user_docs_select_self" ON storage.objects;
CREATE POLICY "user_docs_select_self" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'user-documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.get_auth_user_role() IN ('admin', 'verifier', 'legal_reviewer')
    )
  );

-- Admin: Full Access to user-documents
DROP POLICY IF EXISTS "user_docs_admin_full" ON storage.objects;
CREATE POLICY "user_docs_admin_full" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'user-documents' AND
    public.get_auth_user_role() = 'admin'
  )
  WITH CHECK (
    bucket_id = 'user-documents' AND
    public.get_auth_user_role() = 'admin'
  );
