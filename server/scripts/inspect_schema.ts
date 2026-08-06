import { supabaseAdmin } from '../src/config/database';

async function inspect() {
  const { data, error } = await supabaseAdmin.from('assets').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else if (data && data[0]) {
    console.log('Assets Columns:', Object.keys(data[0]));
  }
}

inspect();
