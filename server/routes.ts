import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAssetSchema, 
  insertTransactionSchema, 
  createAssetSchema, 
  transferSchema 
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all assets
  app.get("/api/assets", async (req, res) => {
    try {
      const assets = await storage.getAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  // Get asset by ID
  app.get("/api/assets/:assetId", async (req, res) => {
    try {
      const { assetId } = req.params;
      const asset = await storage.getAssetById(assetId);
      
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      res.json(asset);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch asset" });
    }
  });

  // Create new asset
  app.post("/api/assets", async (req, res) => {
    try {
      const payload = createAssetSchema.parse(req.body);
      
      // In a real implementation, this would interact with Polkadot.js API
      // For now, we'll create a simple in-memory representation
      const newAsset = {
        assetId: `#${Math.floor(Math.random() * 10000)}`, // This would be a real on-chain ID
        name: payload.name,
        symbol: payload.symbol,
        decimals: payload.decimals,
        balance: payload.initialSupply,
        creator: req.body.creator || "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", // Default address if not provided
      };
      
      const validatedAsset = insertAssetSchema.parse(newAsset);
      const asset = await storage.createAsset(validatedAsset);
      
      // Create a transaction for asset creation
      const transaction = {
        hash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type: "create",
        assetId: asset.assetId,
        assetName: asset.name,
        assetSymbol: asset.symbol,
        amount: asset.balance,
        sender: asset.creator,
        recipient: asset.creator,
        status: "confirmed",
        timestamp: new Date(),
      };
      
      const validatedTransaction = insertTransactionSchema.parse(transaction);
      await storage.createTransaction(validatedTransaction);
      
      res.status(201).json(asset);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid asset data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  // Transfer asset
  app.post("/api/transfer", async (req, res) => {
    try {
      const payload = transferSchema.parse(req.body);
      const { assetId, recipient, amount } = payload;
      
      // Get the asset
      const asset = await storage.getAssetById(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // In a real implementation, this would verify sufficient balance and perform transfer
      // using Polkadot.js API. For now we'll simulate it.
      const currentBalance = BigInt(asset.balance);
      const transferAmount = BigInt(amount);
      
      if (transferAmount > currentBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Update asset balance
      const newBalance = (currentBalance - transferAmount).toString();
      await storage.updateAssetBalance(assetId, newBalance);
      
      // Create a transaction for the transfer
      const transaction = {
        hash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type: "transfer",
        assetId: asset.assetId,
        assetName: asset.name,
        assetSymbol: asset.symbol,
        amount: `-${amount}`, // Negative for outgoing
        sender: asset.creator, // In a real app, this would be the connected wallet
        recipient,
        status: "confirmed",
        timestamp: new Date(),
      };
      
      const validatedTransaction = insertTransactionSchema.parse(transaction);
      const createdTransaction = await storage.createTransaction(validatedTransaction);
      
      res.status(200).json({ 
        transaction: createdTransaction,
        newBalance 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid transfer data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to transfer asset" });
    }
  });

  // Get all transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get transactions for an asset
  app.get("/api/transactions/:assetId", async (req, res) => {
    try {
      const { assetId } = req.params;
      const transactions = await storage.getTransactionsByAssetId(assetId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
