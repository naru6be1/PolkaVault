import { pgTable, text, serial, integer, boolean, timestamp, numeric, primaryKey, unique, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  assets: many(assets),
  liquidityPositions: many(liquidityPositions),
  stakingPositions: many(stakingPositions),
}));

// Assets in the Polkadot Asset Hub
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetId: text("asset_id").notNull().unique(), // On-chain asset ID
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimals: integer("decimals").notNull(),
  balance: text("balance").notNull().default("0"), // Stored as string to handle large numbers
  creator: text("creator").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
});

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;

export const assetsRelations = relations(assets, ({ many }) => ({
  transactions: many(transactions),
  liquidityPoolsA: many(liquidityPools, { relationName: "assetA" }),
  liquidityPoolsB: many(liquidityPools, { relationName: "assetB" }),
  stakingPools: many(stakingPools),
}));

// Transactions for Asset Hub
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull().unique(),
  type: text("type").notNull(), // "transfer", "create", "receive", "fee", "provide_liquidity", "withdraw_liquidity", "stake", "unstake"
  assetId: text("asset_id").notNull(),
  assetName: text("asset_name").notNull(),
  assetSymbol: text("asset_symbol").notNull(),
  amount: text("amount").notNull(), // Stored as string to handle large numbers
  sender: text("sender"), 
  recipient: text("recipient"),
  status: text("status").notNull(), // "pending", "confirmed", "failed"
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  poolId: integer("pool_id").references(() => liquidityPools.id),
  stakingId: integer("staking_id").references(() => stakingPools.id),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const transactionsRelations = relations(transactions, ({ one }) => ({
  asset: one(assets, {
    fields: [transactions.assetId],
    references: [assets.assetId],
  }),
  liquidityPool: one(liquidityPools, {
    fields: [transactions.poolId],
    references: [liquidityPools.id],
  }),
  stakingPool: one(stakingPools, {
    fields: [transactions.stakingId],
    references: [stakingPools.id],
  }),
}));

// Asset creation payload
export const createAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  symbol: z.string().min(1, "Asset symbol is required").max(10, "Symbol must be 10 characters or less"),
  decimals: z.number().int().min(0).max(18),
  initialSupply: z.string().min(1, "Initial supply is required"),
  minBalance: z.string().min(1, "Minimum balance is required"),
});

export type CreateAssetPayload = z.infer<typeof createAssetSchema>;

// Transfer payload
export const transferSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  recipient: z.string().min(1, "Recipient address is required"),
  amount: z.string().min(1, "Amount is required"),
});

export type TransferPayload = z.infer<typeof transferSchema>;

// ======== DeFi Tables ========

// Liquidity Pools
export const liquidityPools = pgTable("liquidity_pools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  assetAId: text("asset_a_id").notNull().references(() => assets.assetId),
  assetBId: text("asset_b_id").notNull().references(() => assets.assetId),
  reserveA: text("reserve_a").notNull().default("0"), // Using string for large numbers
  reserveB: text("reserve_b").notNull().default("0"), // Using string for large numbers
  lpTokenSupply: text("lp_token_supply").notNull().default("0"), // Total supply of LP tokens
  fee: doublePrecision("fee").notNull().default(0.003), // 0.3% default fee
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueAssetPair: unique().on(table.assetAId, table.assetBId),
  }
});

export const insertLiquidityPoolSchema = createInsertSchema(liquidityPools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLiquidityPool = z.infer<typeof insertLiquidityPoolSchema>;
export type LiquidityPool = typeof liquidityPools.$inferSelect;

export const liquidityPoolsRelations = relations(liquidityPools, ({ many, one }) => ({
  positions: many(liquidityPositions),
  transactions: many(transactions),
  assetA: one(assets, {
    fields: [liquidityPools.assetAId],
    references: [assets.assetId],
    relationName: "assetA",
  }),
  assetB: one(assets, {
    fields: [liquidityPools.assetBId],
    references: [assets.assetId],
    relationName: "assetB",
  }),
}));

// Liquidity Positions (user's LP tokens)
export const liquidityPositions = pgTable("liquidity_positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  poolId: integer("pool_id").notNull().references(() => liquidityPools.id),
  lpTokens: text("lp_tokens").notNull(), // Amount of LP tokens the user holds
  sharePercentage: doublePrecision("share_percentage").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueUserPool: unique().on(table.userId, table.poolId),
  }
});

export const insertLiquidityPositionSchema = createInsertSchema(liquidityPositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLiquidityPosition = z.infer<typeof insertLiquidityPositionSchema>;
export type LiquidityPosition = typeof liquidityPositions.$inferSelect;

export const liquidityPositionsRelations = relations(liquidityPositions, ({ one }) => ({
  user: one(users, {
    fields: [liquidityPositions.userId],
    references: [users.id],
  }),
  pool: one(liquidityPools, {
    fields: [liquidityPositions.poolId],
    references: [liquidityPools.id],
  }),
}));

// Staking Pools
export const stakingPools = pgTable("staking_pools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  assetId: text("asset_id").notNull().references(() => assets.assetId),
  totalStaked: text("total_staked").notNull().default("0"), // Using string for large numbers
  rewardRate: doublePrecision("reward_rate").notNull(), // Annual Percentage Rate (APR)
  minStakeAmount: text("min_stake_amount").notNull().default("1"),
  lockPeriodDays: integer("lock_period_days").notNull().default(0), // 0 means no lock period
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStakingPoolSchema = createInsertSchema(stakingPools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStakingPool = z.infer<typeof insertStakingPoolSchema>;
export type StakingPool = typeof stakingPools.$inferSelect;

export const stakingPoolsRelations = relations(stakingPools, ({ many, one }) => ({
  positions: many(stakingPositions),
  asset: one(assets, {
    fields: [stakingPools.assetId],
    references: [assets.assetId],
  }),
}));

// Staking Positions
export const stakingPositions = pgTable("staking_positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  poolId: integer("pool_id").notNull().references(() => stakingPools.id),
  stakedAmount: text("staked_amount").notNull(), // Using string for large numbers
  rewardEarned: text("reward_earned").notNull().default("0"), // Using string for large numbers
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"), // Null means ongoing/no end date
  lastClaimDate: timestamp("last_claim_date").defaultNow(),
  status: text("status").notNull().default("active"), // active, ended, etc.
}, (table) => {
  return {
    uniqueUserPool: unique().on(table.userId, table.poolId),
  }
});

export const insertStakingPositionSchema = createInsertSchema(stakingPositions).omit({
  id: true,
  rewardEarned: true,
  startDate: true,
  lastClaimDate: true,
});

export type InsertStakingPosition = z.infer<typeof insertStakingPositionSchema>;
export type StakingPosition = typeof stakingPositions.$inferSelect;

export const stakingPositionsRelations = relations(stakingPositions, ({ one }) => ({
  user: one(users, {
    fields: [stakingPositions.userId],
    references: [users.id],
  }),
  pool: one(stakingPools, {
    fields: [stakingPositions.poolId],
    references: [stakingPools.id],
  }),
}));

// ======== DeFi Validation Schemas ========

export const createLiquidityPoolSchema = z.object({
  name: z.string().min(1, "Pool name is required"),
  assetAId: z.string().min(1, "First asset is required"),
  assetBId: z.string().min(1, "Second asset is required"),
  fee: z.number().min(0).max(1).default(0.003),
});

export type CreateLiquidityPoolPayload = z.infer<typeof createLiquidityPoolSchema>;

export const provideLiquiditySchema = z.object({
  poolId: z.number().int().positive("Pool ID is required"),
  amountA: z.string().min(1, "Amount for first asset is required"),
  amountB: z.string().min(1, "Amount for second asset is required"),
});

export type ProvideLiquidityPayload = z.infer<typeof provideLiquiditySchema>;

export const withdrawLiquiditySchema = z.object({
  positionId: z.number().int().positive("Position ID is required"),
  percentage: z.number().min(0.01).max(1).default(1), // Default to 100% withdrawal
});

export type WithdrawLiquidityPayload = z.infer<typeof withdrawLiquiditySchema>;

export const createStakingPoolSchema = z.object({
  name: z.string().min(1, "Pool name is required"),
  assetId: z.string().min(1, "Asset is required"),
  rewardRate: z.number().min(0.01).max(1000),
  minStakeAmount: z.string().default("1"),
  lockPeriodDays: z.number().int().min(0).default(0),
});

export type CreateStakingPoolPayload = z.infer<typeof createStakingPoolSchema>;

export const stakeAssetsSchema = z.object({
  poolId: z.number().int().positive("Pool ID is required"),
  amount: z.string().min(1, "Stake amount is required"),
});

export type StakeAssetsPayload = z.infer<typeof stakeAssetsSchema>;

export const unstakeAssetsSchema = z.object({
  positionId: z.number().int().positive("Position ID is required"),
  amount: z.string().min(1, "Unstake amount is required"),
});

export type UnstakeAssetsPayload = z.infer<typeof unstakeAssetsSchema>;
