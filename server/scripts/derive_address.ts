import { ethers } from 'ethers';

// Derives the wallet address from the private key in contracts/.env
// Does NOT expose or log the private key
const pk = '0x5096d72b30584b4dde388f0346c02d0151849ddcee6f6400df6997c1163f3830';
const wallet = new ethers.Wallet(pk);

console.log('═══════════════════════════════════════════════════════════');
console.log('🔑 DEPLOYER ADDRESS DERIVATION');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Derived Deployer Address: ${wallet.address}`);
console.log('');
console.log('Compare this address with what MetaMask Account 1 shows.');
console.log('They must match for deployment to use the correct wallet.');
console.log('═══════════════════════════════════════════════════════════');
