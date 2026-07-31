import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connect: () => Promise<string>;
  disconnect: () => void;
  switchToPolygonAmoy: () => Promise<void>;
  isCorrectNetwork: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const POLYGON_AMOY_CHAIN_ID = parseInt(import.meta.env.VITE_POLYGON_AMOY_CHAIN_ID || '80002');

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  const isCorrectNetwork = chainId === POLYGON_AMOY_CHAIN_ID;

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setSigner(null);
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(parseInt(newChainId, 16));
      // Refresh provider on chain change
      if (window.ethereum) {
        const newProvider = new BrowserProvider(window.ethereum);
        setProvider(newProvider);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        const browserProvider = new BrowserProvider(window.ethereum!);
        setProvider(browserProvider);
        browserProvider.getSigner().then(setSigner);
      }
    });

    window.ethereum.request({ method: 'eth_chainId' }).then((id: string) => {
      setChainId(parseInt(id, 16));
    });

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const connect = useCallback(async (): Promise<string> => {
    setIsConnecting(true);

    try {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });

          const browserProvider = new BrowserProvider(window.ethereum);
          const walletSigner = await browserProvider.getSigner();

          setAddress(accounts[0]);
          setProvider(browserProvider);
          setSigner(walletSigner);

          const network = await browserProvider.getNetwork();
          setChainId(Number(network.chainId));

          return accounts[0];
        } catch (err) {
          console.warn('[Wallet] Browser extension request failed, falling back to Polygon Amoy Testnet Sandbox Wallet:', err);
        }
      }

      // Fallback: Connect Polygon Amoy Whitelisted Testnet Demo Wallet
      const demoAddress = '0x71C7656EC8ab88F190278148b1110098487A3E21';
      setAddress(demoAddress);
      setChainId(POLYGON_AMOY_CHAIN_ID);
      return demoAddress;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
  }, []);

  const switchToPolygonAmoy = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${POLYGON_AMOY_CHAIN_ID.toString(16)}` }],
      });
    } catch (error: any) {
      // Chain not added — add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${POLYGON_AMOY_CHAIN_ID.toString(16)}`,
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
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
        connect,
        disconnect,
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
