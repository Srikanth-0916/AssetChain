import { supabaseAdmin } from '../src/config/database';

async function main() {
  const { data } = await supabaseAdmin.from('assets').select('asset_type').limit(5);
  console.log('Sample asset_types in DB:', data);
}

main();
