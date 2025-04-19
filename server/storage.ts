import { 
  users, User, InsertUser, 
  assets, Asset, InsertAsset,
  transactions, Transaction, InsertTransaction,
  liquidityPools, LiquidityPool, InsertLiquidityPool,
  liquidityPositions, LiquidityPosition, InsertLiquidityPosition,
  stakingPools, StakingPool, InsertStakingPool,
  stakingPositions, StakingPosition, InsertStakingPosition
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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

  // Liquidity Pools
  getLiquidityPools(): Promise<LiquidityPool[]>;
  getLiquidityPoolById(id: number): Promise<LiquidityPool | undefined>;
  createLiquidityPool(pool: InsertLiquidityPool): Promise<LiquidityPool>;
  updateLiquidityPool(id: number, updates: Partial<LiquidityPool>): Promise<LiquidityPool | undefined>;
  
  // Liquidity Positions
  getLiquidityPositionsByUserId(userId: number): Promise<LiquidityPosition[]>;
  getLiquidityPositionById(id: number): Promise<LiquidityPosition | undefined>;
  createLiquidityPosition(position: InsertLiquidityPosition): Promise<LiquidityPosition>;
  updateLiquidityPosition(id: number, updates: Partial<LiquidityPosition>): Promise<LiquidityPosition | undefined>;
  deleteLiquidityPosition(id: number): Promise<boolean>;
  
  // Staking Pools
  getStakingPools(): Promise<StakingPool[]>;
  getStakingPoolById(id: number): Promise<StakingPool | undefined>;
  createStakingPool(pool: InsertStakingPool): Promise<StakingPool>;
  updateStakingPool(id: number, updates: Partial<StakingPool>): Promise<StakingPool | undefined>;
  
  // Staking Positions
  getStakingPositionsByUserId(userId: number): Promise<StakingPosition[]>;
  getStakingPositionById(id: number): Promise<StakingPosition | undefined>;
  getStakingPositionByUserAndPool(userId: number, poolId: number): Promise<StakingPosition | undefined>;
  createStakingPosition(position: InsertStakingPosition): Promise<StakingPosition>;
  updateStakingPosition(id: number, updates: Partial<StakingPosition>): Promise<StakingPosition | undefined>;
  deleteStakingPosition(id: number): Promise<boolean>;
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

  // Liquidity Pool operations
  async getLiquidityPools(): Promise<LiquidityPool[]> {
    return db.select().from(liquidityPools);
  }

  async getLiquidityPoolById(id: number): Promise<LiquidityPool | undefined> {
    const [pool] = await db
      .select()
      .from(liquidityPools)
      .where(eq(liquidityPools.id, id));
    return pool || undefined;
  }

  async createLiquidityPool(insertPool: InsertLiquidityPool): Promise<LiquidityPool> {
    const [pool] = await db
      .insert(liquidityPools)
      .values(insertPool)
      .returning();
    return pool;
  }

  async updateLiquidityPool(id: number, updates: Partial<LiquidityPool>): Promise<LiquidityPool | undefined> {
    const [updatedPool] = await db
      .update(liquidityPools)
      .set(updates)
      .where(eq(liquidityPools.id, id))
      .returning();
    return updatedPool || undefined;
  }

  // Liquidity Position operations
  async getLiquidityPositionsByUserId(userId: number): Promise<LiquidityPosition[]> {
    return db
      .select()
      .from(liquidityPositions)
      .where(eq(liquidityPositions.userId, userId));
  }

  async getLiquidityPositionById(id: number): Promise<LiquidityPosition | undefined> {
    const [position] = await db
      .select()
      .from(liquidityPositions)
      .where(eq(liquidityPositions.id, id));
    return position || undefined;
  }

  async createLiquidityPosition(insertPosition: InsertLiquidityPosition): Promise<LiquidityPosition> {
    const [position] = await db
      .insert(liquidityPositions)
      .values(insertPosition)
      .returning();
    return position;
  }

  async updateLiquidityPosition(id: number, updates: Partial<LiquidityPosition>): Promise<LiquidityPosition | undefined> {
    const [updatedPosition] = await db
      .update(liquidityPositions)
      .set(updates)
      .where(eq(liquidityPositions.id, id))
      .returning();
    return updatedPosition || undefined;
  }

  async deleteLiquidityPosition(id: number): Promise<boolean> {
    const result = await db
      .delete(liquidityPositions)
      .where(eq(liquidityPositions.id, id));
    return result.rowCount > 0;
  }

  // Staking Pool operations
  async getStakingPools(): Promise<StakingPool[]> {
    return db.select().from(stakingPools);
  }

  async getStakingPoolById(id: number): Promise<StakingPool | undefined> {
    const [pool] = await db
      .select()
      .from(stakingPools)
      .where(eq(stakingPools.id, id));
    return pool || undefined;
  }

  async createStakingPool(insertPool: InsertStakingPool): Promise<StakingPool> {
    const [pool] = await db
      .insert(stakingPools)
      .values(insertPool)
      .returning();
    return pool;
  }

  async updateStakingPool(id: number, updates: Partial<StakingPool>): Promise<StakingPool | undefined> {
    const [updatedPool] = await db
      .update(stakingPools)
      .set(updates)
      .where(eq(stakingPools.id, id))
      .returning();
    return updatedPool || undefined;
  }

  // Staking Position operations
  async getStakingPositionsByUserId(userId: number): Promise<StakingPosition[]> {
    return db
      .select()
      .from(stakingPositions)
      .where(eq(stakingPositions.userId, userId));
  }

  async getStakingPositionById(id: number): Promise<StakingPosition | undefined> {
    const [position] = await db
      .select()
      .from(stakingPositions)
      .where(eq(stakingPositions.id, id));
    return position || undefined;
  }

  async getStakingPositionByUserAndPool(userId: number, poolId: number): Promise<StakingPosition | undefined> {
    const [position] = await db
      .select()
      .from(stakingPositions)
      .where(
        and(
          eq(stakingPositions.userId, userId),
          eq(stakingPositions.poolId, poolId)
        )
      );
    return position || undefined;
  }

  async createStakingPosition(insertPosition: InsertStakingPosition): Promise<StakingPosition> {
    const [position] = await db
      .insert(stakingPositions)
      .values(insertPosition)
      .returning();
    return position;
  }

  async updateStakingPosition(id: number, updates: Partial<StakingPosition>): Promise<StakingPosition | undefined> {
    const [updatedPosition] = await db
      .update(stakingPositions)
      .set(updates)
      .where(eq(stakingPositions.id, id))
      .returning();
    return updatedPosition || undefined;
  }

  async deleteStakingPosition(id: number): Promise<boolean> {
    const result = await db
      .delete(stakingPositions)
      .where(eq(stakingPositions.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
