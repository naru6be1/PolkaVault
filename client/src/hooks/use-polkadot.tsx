import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { initApi, connectExtension, getAccountBalance } from '@/lib/polkadot';
import { useToast } from '@/hooks/use-toast';

interface PolkadotContextType {
  api: ApiPromise | null;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  balance: string;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectAccount: (account: InjectedAccountWithMeta) => void;
}

const PolkadotContext = createContext<PolkadotContextType>({
  api: null,
  accounts: [],
  selectedAccount: null,
  balance: '0',
  loading: false,
  error: null,
  initialized: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  selectAccount: () => {},
});

export function PolkadotProvider({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  // Initialize API
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const api = await initApi();
        setApi(api);
        setInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize Polkadot API:', err);
        setError('Failed to connect to PolkaVault. Please try again.');
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to connect to PolkaVault. Please check your network connection.",
        });
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, []);

  // Update balance when selected account changes
  useEffect(() => {
    async function updateBalance() {
      if (api && selectedAccount) {
        try {
          const balance = await getAccountBalance(api, selectedAccount.address);
          setBalance(balance);
        } catch (err) {
          console.error('Failed to get account balance:', err);
        }
      }
    }

    updateBalance();
  }, [api, selectedAccount]);

  // Connect wallet
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accounts = await connectExtension();
      setAccounts(accounts);
      
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0]);
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Polkadot Asset Hub",
        });
      }
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: err.message || "Failed to connect wallet. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setSelectedAccount(null);
    setAccounts([]);
    setBalance('0');
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully",
    });
  };

  // Select account
  const selectAccount = (account: InjectedAccountWithMeta) => {
    setSelectedAccount(account);
  };

  const value = {
    api,
    accounts,
    selectedAccount,
    balance,
    loading,
    error,
    initialized,
    connectWallet,
    disconnectWallet,
    selectAccount,
  };

  return <PolkadotContext.Provider value={value}>{children}</PolkadotContext.Provider>;
}

export const usePolkadot = () => useContext(PolkadotContext);
