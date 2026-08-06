import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
const contractsEnvPath = path.join(__dirname, '..', 'contracts', '.env');

if (fs.existsSync(serverEnvPath)) {
  const serverEnv = fs.readFileSync(serverEnvPath, 'utf-8');
  const match = serverEnv.match(/DEPLOYER_PRIVATE_KEY=(.*)/);
  if (match && match[1] && !match[1].includes('0000000000000000000000000000000000000000000000000000000000000001')) {
    const pk = match[1].trim();
    let contractsEnv = `POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB\nDEPLOYER_PRIVATE_KEY=${pk}\nPOLYGONSCAN_API_KEY=\n`;
    fs.writeFileSync(contractsEnvPath, contractsEnv);
    console.log('✅ Synced real DEPLOYER_PRIVATE_KEY into contracts/.env');
  }
}
