import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

// Transactions for Asset Hub
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull().unique(),
  type: text("type").notNull(), // "transfer", "create", "receive", "fee"
  assetId: text("asset_id").notNull(),
  assetName: text("asset_name").notNull(),
  assetSymbol: text("asset_symbol").notNull(),
  amount: text("amount").notNull(), // Stored as string to handle large numbers
  sender: text("sender"), 
  recipient: text("recipient"),
  status: text("status").notNull(), // "pending", "confirmed", "failed"
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

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
