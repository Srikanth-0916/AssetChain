import { supabaseAdmin } from '../src/config/database';

async function main() {
  const { data, error } = await supabaseAdmin.from('assets').select('id, title, token_price');
  if (error) {
    console.error('❌ Error fetching assets:', error.message);
  } else {
    console.log(`✅ Loaded ${data?.length || 0} assets:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

main();
