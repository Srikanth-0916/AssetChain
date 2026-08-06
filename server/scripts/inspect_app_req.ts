import { supabaseAdmin } from '../src/config/database';

async function main() {
  const { data, error } = await supabaseAdmin.from('approval_requests').select('*').limit(1);
  if (error) console.error(error.message);
  else console.log('approval_requests columns:', Object.keys(data[0] || {}));
}

main();
