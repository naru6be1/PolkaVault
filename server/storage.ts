import { 
  users, User, InsertUser, 
  assets, Asset, InsertAsset,
  transactions, Transaction, InsertTransaction
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Asset operations
  getAssets(): Promise<Asset[]>;
  getAssetById(assetId: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAssetBalance(assetId: string, balance: string): Promise<Asset | undefined>;
  
  // Transaction operations
  getTransactions(): Promise<Transaction[]>;
  getTransactionsByAssetId(assetId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(hash: string, status: string): Promise<Transaction | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assets: Map<string, Asset>;
  private transactions: Map<number, Transaction>;
  private userCurrentId: number;
  private assetCurrentId: number;
  private transactionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.assets = new Map();
    this.transactions = new Map();
    this.userCurrentId = 1;
    this.assetCurrentId = 1;
    this.transactionCurrentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Asset operations
  async getAssets(): Promise<Asset[]> {
    return Array.from(this.assets.values());
  }

  async getAssetById(assetId: string): Promise<Asset | undefined> {
    return Array.from(this.assets.values()).find(
      (asset) => asset.assetId === assetId,
    );
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = this.assetCurrentId++;
    const now = new Date();
    const asset: Asset = { ...insertAsset, id, createdAt: now };
    this.assets.set(asset.assetId, asset);
    return asset;
  }

  async updateAssetBalance(assetId: string, balance: string): Promise<Asset | undefined> {
    const asset = await this.getAssetById(assetId);
    if (!asset) return undefined;
    
    const updatedAsset: Asset = { ...asset, balance };
    this.assets.set(assetId, updatedAsset);
    return updatedAsset;
  }

  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first
  }

  async getTransactionsByAssetId(assetId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.assetId === assetId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionCurrentId++;
    const transaction: Transaction = { ...insertTransaction, id };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(hash: string, status: string): Promise<Transaction | undefined> {
    const transaction = Array.from(this.transactions.values()).find(
      (tx) => tx.hash === hash,
    );
    
    if (!transaction) return undefined;
    
    const updatedTransaction: Transaction = { ...transaction, status };
    this.transactions.set(transaction.id, updatedTransaction);
    return updatedTransaction;
  }
}

export const storage = new MemStorage();
