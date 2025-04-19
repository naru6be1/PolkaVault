import { 
  users, User, InsertUser, 
  assets, Asset, InsertAsset,
  transactions, Transaction, InsertTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Asset operations
  async getAssets(): Promise<Asset[]> {
    return db.select().from(assets);
  }

  async getAssetById(assetId: string): Promise<Asset | undefined> {
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.assetId, assetId));
    return asset || undefined;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values(insertAsset)
      .returning();
    return asset;
  }

  async updateAssetBalance(assetId: string, balance: string): Promise<Asset | undefined> {
    const [updatedAsset] = await db
      .update(assets)
      .set({ balance })
      .where(eq(assets.assetId, assetId))
      .returning();
    return updatedAsset || undefined;
  }

  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.timestamp));
  }

  async getTransactionsByAssetId(assetId: string): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.assetId, assetId))
      .orderBy(desc(transactions.timestamp));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateTransactionStatus(hash: string, status: string): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({ status })
      .where(eq(transactions.hash, hash))
      .returning();
    return updatedTransaction || undefined;
  }
}

export const storage = new DatabaseStorage();
