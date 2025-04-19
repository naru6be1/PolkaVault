import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { Keyring } from '@polkadot/keyring';
import { stringToU8a } from '@polkadot/util';
import { BN } from '@polkadot/util';

// Default WS endpoint for Asset Hub
// Using a public test endpoint for better reliability in this example
const DEFAULT_ENDPOINT = 'wss://westend-asset-hub-rpc.polkadot.io';

export async function initApi(endpoint = DEFAULT_ENDPOINT): Promise<ApiPromise> {
  const wsProvider = new WsProvider(endpoint);
  const api = await ApiPromise.create({ provider: wsProvider });
  return api;
}

export async function connectExtension(appName = 'Polkadot Asset Hub'): Promise<InjectedAccountWithMeta[]> {
  const extensions = await web3Enable(appName);
  
  if (extensions.length === 0) {
    throw new Error('No extension found. Please install the Polkadot.js extension.');
  }
  
  const allAccounts = await web3Accounts();
  
  if (allAccounts.length === 0) {
    throw new Error('No accounts found. Please create an account in the Polkadot.js extension.');
  }
  
  return allAccounts;
}

export async function getAccountBalance(api: ApiPromise, address: string): Promise<string> {
  // Use type assertion to handle the account structure
  const accountInfo = await api.query.system.account(address);
  // @ts-ignore - Handle Polkadot.js API's dynamic types
  const balance = accountInfo.data ? accountInfo.data.free : accountInfo.free;
  return balance.toString();
}

export async function getAssets(api: ApiPromise, accountAddress: string) {
  const assetMetadataEntries = await api.query.assets.metadata.entries();
  const assetInfoEntries = await api.query.assets.asset.entries();
  
  const assetIds = assetInfoEntries.map(([key]) => {
    const assetId = key.args[0].toString();
    return assetId;
  });
  
  const assetMetadata = new Map();
  assetMetadataEntries.forEach(([key, value]) => {
    const assetId = key.args[0].toString();
    // @ts-ignore - Handle Polkadot.js API's dynamic types
    assetMetadata.set(assetId, {
      // @ts-ignore - Handle Polkadot.js API's dynamic types
      name: value.name ? value.name.toString() : 'Unknown',
      // @ts-ignore - Handle Polkadot.js API's dynamic types
      symbol: value.symbol ? value.symbol.toString() : 'UNK',
      // @ts-ignore - Handle Polkadot.js API's dynamic types
      decimals: value.decimals ? value.decimals.toNumber() : 0,
    });
  });
  
  const assets = [];
  
  for (const assetId of assetIds) {
    try {
      const accountBalance = await api.query.assets.account(assetId, accountAddress);
      const metadata = assetMetadata.get(assetId) || { name: 'Unknown', symbol: 'UNK', decimals: 0 };
      
      // @ts-ignore - Handle Polkadot.js API's dynamic types
      if (accountBalance && (accountBalance.isSome || accountBalance.isEmpty === false)) {
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        const balance = accountBalance.unwrap ? accountBalance.unwrap().balance : accountBalance.balance;
        
        assets.push({
          assetId,
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          balance: balance ? balance.toString() : '0',
        });
      }
    } catch (error) {
      console.error(`Error fetching data for asset ${assetId}:`, error);
    }
  }
  
  return assets;
}

export async function createAsset(
  api: ApiPromise, 
  account: InjectedAccountWithMeta, 
  name: string, 
  symbol: string, 
  decimals: number,
  initialSupply: string,
  minBalance: string
) {
  const injector = await web3FromSource(account.meta.source);
  
  // This is a simplified version - in a real app you would use the actual asset hub calls
  // For now, we'll just create metadata to simulate asset creation
  // In production, this would involve calls to assets.create, assets.setMetadata, etc.
  
  const tx = api.tx.utility.batchAll([
    api.tx.assets.create('1000', account.address, minBalance),
    api.tx.assets.setMetadata('1000', name, symbol, decimals),
    api.tx.assets.mint('1000', account.address, initialSupply)
  ]);
  
  const result = await tx.signAndSend(account.address, { signer: injector.signer });
  return result;
}

export async function transferAsset(
  api: ApiPromise,
  account: InjectedAccountWithMeta,
  assetId: string,
  recipient: string,
  amount: string
) {
  const injector = await web3FromSource(account.meta.source);
  
  const tx = api.tx.assets.transfer(assetId, recipient, amount);
  const result = await tx.signAndSend(account.address, { signer: injector.signer });
  
  return result;
}

export interface VerifiedAsset {
  exists: boolean;
  onChainDetails?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    owner?: string;
    admin?: string;
    issuer?: string;
    freezer?: string;
    supply?: string;
    deposit?: string;
    minBalance?: string;
    isSufficient?: boolean;
    accounts?: number;
    sufficients?: number;
    approvals?: number;
    status?: string;
  };
  error?: string;
}

export async function verifyAssetOnChain(api: ApiPromise, assetId: string): Promise<VerifiedAsset> {
  try {
    // Fetch asset info and metadata
    const assetInfo = await api.query.assets.asset(assetId);
    const assetMetadata = await api.query.assets.metadata(assetId);
    
    // If asset doesn't exist
    // @ts-ignore - Handle Polkadot.js API's dynamic types
    if (assetInfo.isNone || assetInfo.isEmpty) {
      return { exists: false };
    }
    
    // Parse asset info
    // @ts-ignore - Handle Polkadot.js API's dynamic types
    const info = assetInfo.unwrap ? assetInfo.unwrap() : assetInfo;
    // @ts-ignore - Handle Polkadot.js API's dynamic types
    const metadata = assetMetadata.unwrap ? assetMetadata.unwrap() : assetMetadata;
    
    return {
      exists: true,
      onChainDetails: {
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        name: metadata.name?.toString(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        symbol: metadata.symbol?.toString(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        decimals: metadata.decimals?.toNumber(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        owner: info.owner?.toString(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        admin: info.admin?.toString(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        issuer: info.issuer?.toString(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        freezer: info.freezer?.toString(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        supply: info.supply?.toString(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        deposit: info.deposit?.toString(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        minBalance: info.minBalance?.toString(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        isSufficient: info.isSufficient,
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        accounts: info.accounts?.toNumber(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        sufficients: info.sufficients?.toNumber(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        approvals: info.approvals?.toNumber(),
        // @ts-ignore - Handle Polkadot.js API's dynamic types
        status: info.status?.toString()
      }
    };
  } catch (error) {
    console.error('Error verifying asset on chain:', error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error verifying asset'
    };
  }
}
