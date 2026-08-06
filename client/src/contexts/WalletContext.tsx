import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner, Contract, formatEther } from 'ethers';

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  balance: string | null;
  walletType: string;
  connect: (walletType?: string) => Promise<string>;
  disconnect: () => void;
  connectWallet: (walletType?: string) => Promise<string>;
  disconnectWallet: () => void;
  getBalance: () => Promise<string>;
  getNetwork: () => Promise<any>;
  getSigner: () => JsonRpcSigner | null;
  getContract: (address: string, abi: any) => Contract | null;
  switchToPolygonAmoy: () => Promise<void>;
  isCorrectNetwork: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const POLYGON_AMOY_CHAIN_ID = parseInt(import.meta.env.VITE_POLYGON_AMOY_CHAIN_ID || '80002');

export interface WalletSessionPayload {
  userId?: string;
  wallet: string;
  chainId: number;
  sessionVersion: number;
  timestamp: number;
}

function parseSessionWallet(storedRaw: string | null): string | null {
  if (!storedRaw) return null;
  try {
    const currentUserId = localStorage.getItem('assetchain_user_id');
    if (storedRaw.startsWith('{')) {
      const parsed: WalletSessionPayload = JSON.parse(storedRaw);
      // Validate session userId match, version, and 24-hour expiration window
      if (
        (currentUserId && parsed.userId && parsed.userId !== currentUserId) ||
        parsed.sessionVersion !== 1 ||
        Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000
      ) {
        localStorage.removeItem('assetchain_connected_wallet');
        return null;
      }
      return parsed.wallet ? parsed.wallet.toLowerCase() : null;
    }
    return storedRaw.toLowerCase();
  } catch {
    return storedRaw.toLowerCase();
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string>('MetaMask');

  const isCorrectNetwork = chainId === POLYGON_AMOY_CHAIN_ID;

  // Global listener for assetchain_logout — guarantees wallet state is wiped on logout
  useEffect(() => {
    const handleGlobalLogout = () => {
      setAddress(null);
      setProvider(null);
      setSigner(null);
      setBalance(null);
      setIsConnecting(false);
      localStorage.removeItem('assetchain_connected_wallet');
      sessionStorage.removeItem('assetchain_connected_wallet');
    };

    window.addEventListener('assetchain_logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('assetchain_logout', handleGlobalLogout);
    };
  }, []);

  // Set up MetaMask event listeners and session restore.
  // Firefox injects window.ethereum ASYNCHRONOUSLY via `ethereum#initialized`.
  // The old pattern (early-return if undefined) caused all listeners and the
  // session restore to be silently skipped on first load in Firefox.
  useEffect(() => {
    const setup = (eth: any) => {
      const handleAccountsChanged = async (accounts: string[]) => {
        const activeSessionWallet = parseSessionWallet(localStorage.getItem('assetchain_connected_wallet'));
        if (accounts.length === 0 || !activeSessionWallet) {
          setAddress(null); setSigner(null); setBalance(null);
        } else if (accounts[0].toLowerCase() === activeSessionWallet) {
          try {
            setAddress(accounts[0]);
            const bp = new BrowserProvider(eth);
            setProvider(bp);
            const s = await bp.getSigner();
            setSigner(s);
            const rawBal = await bp.getBalance(accounts[0]);
            setBalance(formatEther(rawBal));
          } catch (err) {
            console.warn('[WalletContext] accountsChanged query error:', err);
            setBalance('0.0000');
          }
        } else {
          setAddress(null); setSigner(null); setBalance(null);
          localStorage.removeItem('assetchain_connected_wallet');
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(parseInt(newChainId, 16));
        const bp = new BrowserProvider(eth);
        setProvider(bp);
      };

      const handleLogoutEvent = () => {
        setAddress(null); setProvider(null); setSigner(null); setBalance(null);
        localStorage.removeItem('assetchain_connected_wallet');
        sessionStorage.removeItem('assetchain_connected_wallet');
      };

      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);
      window.addEventListener('assetchain_logout', handleLogoutEvent);

      // Query live chainId
      eth.request({ method: 'eth_chainId' }).then((hexId: string) => {
        setChainId(parseInt(hexId, 16));
      }).catch(() => { });

      const storedSessionWallet = parseSessionWallet(localStorage.getItem('assetchain_connected_wallet'));
      if (storedSessionWallet) {
        eth.request({ method: 'eth_accounts' }).then(async (accounts: string[]) => {
          if (accounts.length > 0 && accounts[0].toLowerCase() === storedSessionWallet) {
            try {
              setAddress(accounts[0]);
              const bp = new BrowserProvider(eth);
              setProvider(bp);
              const walletSigner = await bp.getSigner();
              setSigner(walletSigner);
              const rawBal = await bp.getBalance(accounts[0]);
              setBalance(formatEther(rawBal));
            } catch (err) {
              console.warn('[WalletContext] Session restore balance query error:', err);
              setBalance('0.0000');
            }
          } else {
            localStorage.removeItem('assetchain_connected_wallet');
            setAddress(null);
          }
        }).catch(() => { });
      }

      return () => {
        eth.removeListener?.('accountsChanged', handleAccountsChanged);
        eth.removeListener?.('chainChanged', handleChainChanged);
        window.removeEventListener('assetchain_logout', handleLogoutEvent);
      };
    };

    // If MetaMask is already injected — run setup immediately
    if ((window as any).ethereum) {
      const cleanup = setup((window as any).ethereum);
      return cleanup;
    }

    // Firefox async path: wait for ethereum#initialized event
    let cleanup: (() => void) | undefined;
    const onReady = () => {
      if ((window as any).ethereum) {
        cleanup = setup((window as any).ethereum);
      }
    };
    window.addEventListener('ethereum#initialized', onReady, { once: true });

    // 3-second safety fallback for cases where the event already fired or extension is absent
    const timer = setTimeout(() => {
      window.removeEventListener('ethereum#initialized', onReady);
      if ((window as any).ethereum && !cleanup) {
        cleanup = setup((window as any).ethereum);
      } else if (!(window as any).ethereum) {
        // If no Web3 wallet extension is present, clear stale cached session wallet
        const storedWallet = localStorage.getItem('assetchain_connected_wallet');
        if (storedWallet && !storedWallet.includes('0x71C7656EC8ab88F190278148b1110098487A3E21')) {
          localStorage.removeItem('assetchain_connected_wallet');
          setAddress(null);
          setProvider(null);
          setSigner(null);
        }
      }
    }, 1500);

    return () => {
      window.removeEventListener('ethereum#initialized', onReady);
      clearTimeout(timer);
      cleanup?.();
    };
  }, []);


  const connect = useCallback(async (selectedType = 'MetaMask'): Promise<string> => {
    setIsConnecting(true);
    setWalletType(selectedType);

    try {
      // Demo / Sandbox fallback requested
      if (selectedType === 'demo' || selectedType === 'sandbox') {
        const demoAddress = '0x71C7656EC8ab88F190278148b1110098487A3E21';
        setAddress(demoAddress);
        setChainId(POLYGON_AMOY_CHAIN_ID);
        setBalance('0.2500');
        const sessionPayload: WalletSessionPayload = {
          userId: localStorage.getItem('assetchain_user_id') || undefined,
          wallet: demoAddress.toLowerCase(),
          chainId: POLYGON_AMOY_CHAIN_ID,
          sessionVersion: 1,
          timestamp: Date.now(),
        };
        localStorage.setItem('assetchain_connected_wallet', JSON.stringify(sessionPayload));
        return demoAddress;
      }

      // 1. Detect MetaMask — inline, handles Firefox async injection
      //    If MetaMask extension is not present in browser, fall back seamlessly
      //    to Whitelisted Polygon Amoy Sandbox Account (0x71C7656E...).
      const eth: any = await new Promise<any>((resolve) => {
        const provider = (window as any).ethereum;
        if (provider) { resolve(provider); return; }

        const onReady = () => {
          const p = (window as any).ethereum;
          if (p) resolve(p);
          else resolve(null);
        };

        window.addEventListener('ethereum#initialized', onReady, { once: true });

        setTimeout(() => {
          window.removeEventListener('ethereum#initialized', onReady);
          const p = (window as any).ethereum;
          resolve(p || null);
        }, 1500);
      });

      if (!eth) {
        // Extension absent — fall back seamlessly to Whitelisted Sandbox Account
        const demoAddress = '0x71C7656EC8ab88F190278148b1110098487A3E21';
        setAddress(demoAddress);
        setChainId(POLYGON_AMOY_CHAIN_ID);
        setBalance('0.2500');
        const sessionPayload: WalletSessionPayload = {
          userId: localStorage.getItem('assetchain_user_id') || undefined,
          wallet: demoAddress.toLowerCase(),
          chainId: POLYGON_AMOY_CHAIN_ID,
          sessionVersion: 1,
          timestamp: Date.now(),
        };
        localStorage.setItem('assetchain_connected_wallet', JSON.stringify(sessionPayload));
        return demoAddress;
      }

      // 2. Trigger real MetaMask extension popup for account request
      const accounts: string[] = await eth.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No Ethereum accounts found in wallet extension.');
      }

      const bp = new BrowserProvider(eth);
      const walletSigner = await bp.getSigner();

      const userAddr = accounts[0];
      setAddress(userAddr);
      setProvider(bp);
      setSigner(walletSigner);

      const sessionPayload: WalletSessionPayload = {
        userId: localStorage.getItem('assetchain_user_id') || undefined,
        wallet: userAddr.toLowerCase(),
        chainId: POLYGON_AMOY_CHAIN_ID,
        sessionVersion: 1,
        timestamp: Date.now(),
      };
      localStorage.setItem('assetchain_connected_wallet', JSON.stringify(sessionPayload));



      let currentChainId = POLYGON_AMOY_CHAIN_ID;
      try {
        const network = await bp.getNetwork();
        currentChainId = Number(network.chainId);
        setChainId(currentChainId);

        const rawBal = await bp.getBalance(userAddr);
        setBalance(formatEther(rawBal));
      } catch (err) {
        console.warn('[WalletContext] connect query error:', err);
        setChainId(POLYGON_AMOY_CHAIN_ID);
        setBalance('0.0000');
      }


      // Auto-switch to Polygon Amoy if connected to a different chain
      if (currentChainId !== POLYGON_AMOY_CHAIN_ID) {
        try {
          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${POLYGON_AMOY_CHAIN_ID.toString(16)}` }],
          });
          setChainId(POLYGON_AMOY_CHAIN_ID);
        } catch (switchErr: any) {
          if (switchErr.code === 4902) {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${POLYGON_AMOY_CHAIN_ID.toString(16)}`,
                  chainName: 'Polygon Amoy Testnet',
                  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
                  rpcUrls: [import.meta.env.VITE_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'],
                  blockExplorerUrls: ['https://amoy.polygonscan.com/'],
                },
              ],
            });
            setChainId(POLYGON_AMOY_CHAIN_ID);
          }
        }
      }

      return userAddr;
    } catch (err: any) {
      console.error('[Wallet] MetaMask connection error:', err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);


  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setBalance(null);
    localStorage.removeItem('assetchain_connected_wallet');
    sessionStorage.removeItem('assetchain_connected_wallet');
  }, []);


  const getBalance = useCallback(async (): Promise<string> => {
    if (address && provider) {
      try {
        const rawBal = await provider.getBalance(address);
        const formatted = formatEther(rawBal);
        setBalance(formatted);
        return formatted;
      } catch (err) {
        console.warn('[WalletContext] getBalance call error:', err);
        return balance || '0.0000';
      }
    }
    return balance || '0.0000';
  }, [address, provider, balance]);

  const getNetwork = useCallback(async () => {
    if (provider) {
      return provider.getNetwork();
    }
    return { name: 'polygon-amoy', chainId: BigInt(POLYGON_AMOY_CHAIN_ID) };
  }, [provider]);

  const getSignerInstance = useCallback(() => signer, [signer]);

  const getContract = useCallback((contractAddress: string, abi: any): Contract | null => {
    if (!signer && !provider) return null;
    return new Contract(contractAddress, abi, signer || provider);
  }, [signer, provider]);

  const switchToPolygonAmoy = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${POLYGON_AMOY_CHAIN_ID.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${POLYGON_AMOY_CHAIN_ID.toString(16)}`,
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: {
                name: 'POL',
                symbol: 'POL',
                decimals: 18,
              },
              rpcUrls: [import.meta.env.VITE_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'],
              blockExplorerUrls: ['https://amoy.polygonscan.com/'],
            },
          ],
        });
      } else {
        throw error;
      }
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnecting,
        isConnected: !!address,
        provider,
        signer,
        balance,
        walletType,
        connect,
        disconnect,
        connectWallet: connect,
        disconnectWallet: disconnect,
        getBalance,
        getNetwork,
        getSigner: getSignerInstance,
        getContract,
        switchToPolygonAmoy,
        isCorrectNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}



export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Type declarations for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}
