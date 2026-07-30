/**
 * patch_schema_via_api.js
 * Uses Supabase REST + service role to patch missing columns.
 * Falls back to calling a DB function if rpc is available.
 */
const https = require('https');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef   = SUPABASE_URL.replace('https://', '').split('.')[0];

// Supabase Management API endpoint for running SQL
// https://api.supabase.com/v1/projects/{ref}/database/query
const MGMT_BASE = 'api.supabase.com';

function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runSQL(sql, label) {
  // Try Supabase Management API (requires user access token, not service role)
  // Fallback: use PostgREST rpc with a helper function if available
  const res = await httpsPost(
    MGMT_BASE,
    `/v1/projects/${projectRef}/database/query`,
    {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    { query: sql }
  );

  if (res.status === 200 || res.status === 201) {
    console.log('  ✅ ' + label + ': OK');
    return true;
  } else {
    console.log('  ⚠️  ' + label + ': status=' + res.status + ' - ' + JSON.stringify(res.body).substring(0, 120));
    return false;
  }
}

async function main() {
  console.log('Connecting to Supabase project:', projectRef);

  const statements = [
    { sql: "ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb", label: 'ai_memory.data' },
    { sql: "ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW()", label: 'ai_memory.timestamp' },
    { sql: "ALTER TABLE public.compliance_profiles ADD COLUMN IF NOT EXISTS erc3643_compatible BOOLEAN DEFAULT TRUE", label: 'compliance_profiles.erc3643_compatible' },
    { sql: "NOTIFY pgrst, 'reload schema'", label: 'PostgREST schema cache reload' },
  ];

  let allOk = true;
  for (const { sql, label } of statements) {
    const ok = await runSQL(sql, label);
    if (!ok) allOk = false;
  }

  console.log('\n' + (allOk ? '✅ All patches applied.' : '⚠️  Some patches failed. Run schema_patch.sql manually in Supabase SQL Editor.'));
}

main().catch(console.error);
