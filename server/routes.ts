import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAssetSchema, 
  insertTransactionSchema, 
  createAssetSchema, 
  transferSchema,
  createLiquidityPoolSchema,
  provideLiquiditySchema,
  withdrawLiquiditySchema,
  createStakingPoolSchema,
  stakeAssetsSchema,
  unstakeAssetsSchema,
  insertLiquidityPoolSchema,
  insertLiquidityPositionSchema,
  insertStakingPoolSchema,
  insertStakingPositionSchema
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

  // ====== DeFi Routes ======

  // Liquidity Pools

  // Get all liquidity pools
  app.get("/api/liquidity-pools", async (req, res) => {
    try {
      const pools = await storage.getLiquidityPools();
      res.json(pools);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch liquidity pools" });
    }
  });

  // Get a specific liquidity pool
  app.get("/api/liquidity-pools/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await storage.getLiquidityPoolById(parseInt(id));
      
      if (!pool) {
        return res.status(404).json({ message: "Liquidity pool not found" });
      }
      
      res.json(pool);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch liquidity pool" });
    }
  });

  // Create a new liquidity pool
  app.post("/api/liquidity-pools", async (req, res) => {
    try {
      const payload = createLiquidityPoolSchema.parse(req.body);
      
      // Get the assets
      const assetA = await storage.getAssetById(payload.assetAId);
      const assetB = await storage.getAssetById(payload.assetBId);
      
      if (!assetA || !assetB) {
        return res.status(404).json({ message: "One or both assets not found" });
      }
      
      if (payload.assetAId === payload.assetBId) {
        return res.status(400).json({ message: "Cannot create a pool with the same asset" });
      }
      
      // Create the liquidity pool
      const newPool = {
        name: payload.name,
        assetAId: payload.assetAId,
        assetBId: payload.assetBId,
        reserveA: "0",
        reserveB: "0",
        lpTokenSupply: "0",
        fee: payload.fee,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const validatedPool = insertLiquidityPoolSchema.parse(newPool);
      const pool = await storage.createLiquidityPool(validatedPool);
      
      res.status(201).json(pool);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid liquidity pool data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create liquidity pool" });
    }
  });

  // Get liquidity positions for a user
  app.get("/api/liquidity-positions", async (req, res) => {
    try {
      // In a real app this would use the authenticated user's ID
      const userId = 1; // Default user ID for demo
      const positions = await storage.getLiquidityPositionsByUserId(userId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch liquidity positions" });
    }
  });

  // Provide liquidity to a pool
  app.post("/api/liquidity-positions", async (req, res) => {
    try {
      const payload = provideLiquiditySchema.parse(req.body);
      
      // Get the pool
      const pool = await storage.getLiquidityPoolById(payload.poolId);
      if (!pool) {
        return res.status(404).json({ message: "Liquidity pool not found" });
      }
      
      // Get the assets
      const assetA = await storage.getAssetById(pool.assetAId);
      const assetB = await storage.getAssetById(pool.assetBId);
      
      if (!assetA || !assetB) {
        return res.status(404).json({ message: "Pool assets not found" });
      }
      
      // Check user balances
      const amountA = BigInt(payload.amountA);
      const amountB = BigInt(payload.amountB);
      
      // In a real app, check user's balance of both assets
      
      // Update pool reserves
      const newReserveA = (BigInt(pool.reserveA) + amountA).toString();
      const newReserveB = (BigInt(pool.reserveB) + amountB).toString();
      
      // Calculate LP tokens
      let lpTokens;
      if (pool.lpTokenSupply === "0") {
        // First liquidity provision
        lpTokens = Math.sqrt(Number(amountA) * Number(amountB)).toString();
      } else {
        // Subsequent provisions - maintain constant product formula
        const existingLPSupply = BigInt(pool.lpTokenSupply);
        const reserveA = BigInt(pool.reserveA);
        const reserveB = BigInt(pool.reserveB);
        
        // LP tokens = min(amountA / reserveA, amountB / reserveB) * lpTokenSupply
        const ratioA = (amountA * existingLPSupply) / reserveA;
        const ratioB = (amountB * existingLPSupply) / reserveB;
        lpTokens = (ratioA < ratioB ? ratioA : ratioB).toString();
      }
      
      // Create liquidity position
      const newPosition = {
        userId: 1, // Would be the authenticated user in a real app
        poolId: pool.id,
        lpTokens,
        sharePercentage: Number(lpTokens) / (Number(pool.lpTokenSupply) + Number(lpTokens)),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const validatedPosition = insertLiquidityPositionSchema.parse(newPosition);
      const position = await storage.createLiquidityPosition(validatedPosition);
      
      // Update pool reserves and LP token supply
      const newLPSupply = (BigInt(pool.lpTokenSupply) + BigInt(lpTokens)).toString();
      await storage.updateLiquidityPool(pool.id, {
        reserveA: newReserveA,
        reserveB: newReserveB,
        lpTokenSupply: newLPSupply,
        updatedAt: new Date(),
      });
      
      // Create transactions for the liquidity provision
      const transactionA = {
        hash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type: "provide_liquidity",
        assetId: pool.assetAId,
        assetName: assetA.name,
        assetSymbol: assetA.symbol,
        amount: payload.amountA,
        sender: "user_wallet", // Would be the user's wallet in a real app
        recipient: "pool_contract", // Would be the pool's contract address in a real app
        status: "confirmed",
        timestamp: new Date(),
        poolId: pool.id,
      };
      
      const transactionB = {
        hash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type: "provide_liquidity",
        assetId: pool.assetBId,
        assetName: assetB.name,
        assetSymbol: assetB.symbol,
        amount: payload.amountB,
        sender: "user_wallet", // Would be the user's wallet in a real app
        recipient: "pool_contract", // Would be the pool's contract address in a real app
        status: "confirmed",
        timestamp: new Date(),
        poolId: pool.id,
      };
      
      const validatedTransactionA = insertTransactionSchema.parse(transactionA);
      const validatedTransactionB = insertTransactionSchema.parse(transactionB);
      
      await storage.createTransaction(validatedTransactionA);
      await storage.createTransaction(validatedTransactionB);
      
      res.status(201).json({
        position,
        pool: {
          ...pool,
          reserveA: newReserveA,
          reserveB: newReserveB,
          lpTokenSupply: newLPSupply,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid liquidity provision data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to provide liquidity" });
    }
  });

  // Withdraw liquidity
  app.post("/api/liquidity-positions/:id/withdraw", async (req, res) => {
    try {
      const { id } = req.params;
      const { percentage } = withdrawLiquiditySchema.parse(req.body);
      
      // Get the position
      const position = await storage.getLiquidityPositionById(parseInt(id));
      if (!position) {
        return res.status(404).json({ message: "Liquidity position not found" });
      }
      
      // Get the pool
      const pool = await storage.getLiquidityPoolById(position.poolId);
      if (!pool) {
        return res.status(404).json({ message: "Liquidity pool not found" });
      }
      
      // Calculate amounts to withdraw
      const lpTokensToWithdraw = Math.floor(Number(position.lpTokens) * percentage);
      const withdrawRatio = lpTokensToWithdraw / Number(pool.lpTokenSupply);
      
      const amountAToWithdraw = Math.floor(Number(pool.reserveA) * withdrawRatio).toString();
      const amountBToWithdraw = Math.floor(Number(pool.reserveB) * withdrawRatio).toString();
      
      // Update pool reserves and LP token supply
      const newReserveA = (BigInt(pool.reserveA) - BigInt(amountAToWithdraw)).toString();
      const newReserveB = (BigInt(pool.reserveB) - BigInt(amountBToWithdraw)).toString();
      const newLPSupply = (BigInt(pool.lpTokenSupply) - BigInt(lpTokensToWithdraw)).toString();
      
      await storage.updateLiquidityPool(pool.id, {
        reserveA: newReserveA,
        reserveB: newReserveB,
        lpTokenSupply: newLPSupply,
        updatedAt: new Date(),
      });
      
      // Update or remove the position
      const remainingLP = Number(position.lpTokens) - lpTokensToWithdraw;
      
      if (remainingLP <= 0) {
        // Remove the position
        await storage.deleteLiquidityPosition(position.id);
      } else {
        // Update the position
        await storage.updateLiquidityPosition(position.id, {
          lpTokens: remainingLP.toString(),
          sharePercentage: remainingLP / Number(newLPSupply),
          updatedAt: new Date(),
        });
      }
      
      // Get the assets
      const assetA = await storage.getAssetById(pool.assetAId);
      const assetB = await storage.getAssetById(pool.assetBId);
      
      // Create transactions for the withdrawal
      const transactionA = {
        hash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type: "withdraw_liquidity",
        assetId: pool.assetAId,
        assetName: assetA.name,
        assetSymbol: assetA.symbol,
        amount: amountAToWithdraw,
        sender: "pool_contract", // Would be the pool's contract address in a real app
        recipient: "user_wallet", // Would be the user's wallet in a real app
        status: "confirmed",
        timestamp: new Date(),
        poolId: pool.id,
      };
      
      const transactionB = {
        hash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type: "withdraw_liquidity",
        assetId: pool.assetBId,
        assetName: assetB.name,
        assetSymbol: assetB.symbol,
        amount: amountBToWithdraw,
        sender: "pool_contract", // Would be the pool's contract address in a real app
        recipient: "user_wallet", // Would be the user's wallet in a real app
        status: "confirmed",
        timestamp: new Date(),
        poolId: pool.id,
      };
      
      const validatedTransactionA = insertTransactionSchema.parse(transactionA);
      const validatedTransactionB = insertTransactionSchema.parse(transactionB);
      
      await storage.createTransaction(validatedTransactionA);
      await storage.createTransaction(validatedTransactionB);
      
      res.status(200).json({
        amountAWithdrawn: amountAToWithdraw,
        amountBWithdrawn: amountBToWithdraw,
        positionRemoved: remainingLP <= 0,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid withdrawal data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to withdraw liquidity" });
    }
  });

  // Staking

  // Get all staking pools
  app.get("/api/staking-pools", async (req, res) => {
    try {
      const pools = await storage.getStakingPools();
      res.json(pools);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staking pools" });
    }
  });

  // Get a specific staking pool
  app.get("/api/staking-pools/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await storage.getStakingPoolById(parseInt(id));
      
      if (!pool) {
        return res.status(404).json({ message: "Staking pool not found" });
      }
      
      res.json(pool);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staking pool" });
    }
  });

  // Create a new staking pool
  app.post("/api/staking-pools", async (req, res) => {
    try {
      const payload = createStakingPoolSchema.parse(req.body);
      
      // Get the asset
      const asset = await storage.getAssetById(payload.assetId);
      
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      // Create the staking pool
      const newPool = {
        name: payload.name,
        assetId: payload.assetId,
        totalStaked: "0",
        rewardRate: payload.rewardRate,
        minStakeAmount: payload.minStakeAmount,
        lockPeriodDays: payload.lockPeriodDays,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const validatedPool = insertStakingPoolSchema.parse(newPool);
      const pool = await storage.createStakingPool(validatedPool);
      
      res.status(201).json(pool);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid staking pool data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create staking pool" });
    }
  });

  // Get staking positions for a user
  app.get("/api/staking-positions", async (req, res) => {
    try {
      // In a real app this would use the authenticated user's ID
      const userId = 1; // Default user ID for demo
      const positions = await storage.getStakingPositionsByUserId(userId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staking positions" });
    }
  });

  // Stake assets
  app.post("/api/staking-positions", async (req, res) => {
    try {
      console.log("Staking request body:", req.body);
      
      // Validate the input payload
      const payload = stakeAssetsSchema.parse(req.body);
      console.log("Validated staking payload:", payload);
      
      // Get the pool
      const pool = await storage.getStakingPoolById(payload.poolId);
      if (!pool) {
        console.log(`Pool with ID ${payload.poolId} not found`);
        return res.status(404).json({ message: "Staking pool not found" });
      }
      
      // Get the asset
      const asset = await storage.getAssetById(pool.assetId);
      if (!asset) {
        console.log(`Asset with ID ${pool.assetId} not found`);
        return res.status(404).json({ message: "Pool asset not found" });
      }
      
      // Validate the amount is a valid number
      if (isNaN(Number(payload.amount))) {
        return res.status(400).json({ 
          message: "Amount must be a valid number" 
        });
      }
      
      // Check minimum stake amount
      try {
        if (BigInt(payload.amount) < BigInt(pool.minStakeAmount)) {
          return res.status(400).json({ 
            message: `Minimum stake amount is ${pool.minStakeAmount}` 
          });
        }
      } catch (e) {
        console.error("Error comparing BigInt values:", e);
        return res.status(400).json({ 
          message: "Invalid amount format. Please provide a valid number." 
        });
      }
      
      // Check if user already has a position
      const userId = 1; // Default user ID for demo
      const existingPosition = await storage.getStakingPositionByUserAndPool(userId, pool.id);
      
      let position;
      
      if (existingPosition) {
        console.log(`Updating existing position for user ${userId} in pool ${pool.id}`);
        // Update existing position
        try {
          const newStakedAmount = (BigInt(existingPosition.stakedAmount) + BigInt(payload.amount)).toString();
          
          await storage.updateStakingPosition(existingPosition.id, {
            stakedAmount: newStakedAmount,
          });
          
          position = await storage.getStakingPositionById(existingPosition.id);
        } catch (e) {
          console.error("Error updating existing position:", e);
          return res.status(500).json({ 
            message: "Error updating existing staking position", 
            error: e instanceof Error ? e.message : String(e)
          });
        }
      } else {
        console.log(`Creating new position for user ${userId} in pool ${pool.id}`);
        // Calculate end date if there's a lock period
        let endDate = null;
        if (pool.lockPeriodDays > 0) {
          endDate = new Date();
          endDate.setDate(endDate.getDate() + pool.lockPeriodDays);
        }
        
        // Create new position
        try {
          const newPosition = {
            userId,
            poolId: pool.id,
            stakedAmount: payload.amount,
            endDate,
            status: "active",
          };
          
          const validatedPosition = insertStakingPositionSchema.parse(newPosition);
          position = await storage.createStakingPosition(validatedPosition);
        } catch (e) {
          console.error("Error creating new position:", e);
          return res.status(500).json({ 
            message: "Error creating new staking position", 
            error: e instanceof Error ? e.message : String(e)
          });
        }
      }
      
      // Update pool total staked
      try {
        const newTotalStaked = (BigInt(pool.totalStaked) + BigInt(payload.amount)).toString();
        await storage.updateStakingPool(pool.id, {
          totalStaked: newTotalStaked,
        });
        
        // Create transaction for the stake
        const transaction = {
          hash: `0x${Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)).join('')}`,
          type: "stake",
          assetId: pool.assetId,
          assetName: asset.name,
          assetSymbol: asset.symbol,
          amount: payload.amount,
          sender: "user_wallet", // Would be the user's wallet in a real app
          recipient: "staking_contract", // Would be the staking contract address in a real app
          status: "confirmed",
          timestamp: new Date(),
          stakingId: pool.id,
        };
        
        const validatedTransaction = insertTransactionSchema.parse(transaction);
        await storage.createTransaction(validatedTransaction);
        
        console.log("Staking successful, returning position:", position);
        
        res.status(201).json({
          position,
          pool: {
            ...pool,
            totalStaked: newTotalStaked,
          },
        });
      } catch (e) {
        console.error("Error in final staking operations:", e);
        return res.status(500).json({ 
          message: "Error finalizing staking operation", 
          error: e instanceof Error ? e.message : String(e)
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ 
          message: "Invalid staking data", 
          errors: error.errors 
        });
      }
      
      console.error("Unexpected error in staking assets:", error);
      res.status(500).json({ 
        message: "Failed to stake assets", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Unstake assets
  app.post("/api/staking-positions/:id/unstake", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = unstakeAssetsSchema.parse(req.body);
      
      // Get the position
      const position = await storage.getStakingPositionById(parseInt(id));
      if (!position) {
        return res.status(404).json({ message: "Staking position not found" });
      }
      
      // Check if the position is locked
      if (position.endDate && new Date() < new Date(position.endDate)) {
        return res.status(400).json({ 
          message: "Position is locked until " + new Date(position.endDate).toLocaleDateString() 
        });
      }
      
      // Check if amount is valid
      if (BigInt(amount) > BigInt(position.stakedAmount)) {
        return res.status(400).json({ 
          message: "Unstake amount exceeds staked amount" 
        });
      }
      
      // Get the pool
      const pool = await storage.getStakingPoolById(position.poolId);
      if (!pool) {
        return res.status(404).json({ message: "Staking pool not found" });
      }
      
      // Update position
      const remainingStaked = (BigInt(position.stakedAmount) - BigInt(amount)).toString();
      
      if (BigInt(remainingStaked) <= BigInt(0)) {
        // Remove the position
        await storage.deleteStakingPosition(position.id);
      } else {
        // Update the position
        await storage.updateStakingPosition(position.id, {
          stakedAmount: remainingStaked,
          updatedAt: new Date(),
        });
      }
      
      // Update pool total staked
      const newTotalStaked = (BigInt(pool.totalStaked) - BigInt(amount)).toString();
      await storage.updateStakingPool(pool.id, {
        totalStaked: newTotalStaked,
        updatedAt: new Date(),
      });
      
      // Get the asset
      const asset = await storage.getAssetById(pool.assetId);
      
      // Create transaction for the unstake
      const transaction = {
        hash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type: "unstake",
        assetId: pool.assetId,
        assetName: asset.name,
        assetSymbol: asset.symbol,
        amount: amount,
        sender: "staking_contract", // Would be the staking contract address in a real app
        recipient: "user_wallet", // Would be the user's wallet in a real app
        status: "confirmed",
        timestamp: new Date(),
        stakingId: pool.id,
      };
      
      const validatedTransaction = insertTransactionSchema.parse(transaction);
      await storage.createTransaction(validatedTransaction);
      
      res.status(200).json({
        amountUnstaked: amount,
        positionRemoved: BigInt(remainingStaked) <= BigInt(0),
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid unstaking data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to unstake assets" });
    }
  });

  // Claim staking rewards
  app.post("/api/staking-positions/:id/claim-rewards", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the position
      const position = await storage.getStakingPositionById(parseInt(id));
      if (!position) {
        return res.status(404).json({ message: "Staking position not found" });
      }
      
      // Get the pool
      const pool = await storage.getStakingPoolById(position.poolId);
      if (!pool) {
        return res.status(404).json({ message: "Staking pool not found" });
      }
      
      // Calculate rewards
      const now = new Date();
      const lastClaimDate = new Date(position.lastClaimDate);
      const daysSinceLastClaim = Math.floor((now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastClaim <= 0) {
        return res.status(400).json({ message: "No rewards available to claim yet" });
      }
      
      const dailyRate = pool.rewardRate / 365; // APR to daily rate
      const rewardPercentage = dailyRate * daysSinceLastClaim / 100; // Convert to decimal
      const rewardAmount = Math.floor(Number(position.stakedAmount) * rewardPercentage).toString();
      
      if (BigInt(rewardAmount) <= BigInt(0)) {
        return res.status(400).json({ message: "No rewards available to claim" });
      }
      
      // Update position
      const newRewardEarned = (BigInt(position.rewardEarned) + BigInt(rewardAmount)).toString();
      await storage.updateStakingPosition(position.id, {
        rewardEarned: "0", // Reset rewards after claiming
        lastClaimDate: now,
        updatedAt: now,
      });
      
      // Get the asset
      const asset = await storage.getAssetById(pool.assetId);
      
      // Create transaction for the reward
      const transaction = {
        hash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type: "claim_reward",
        assetId: pool.assetId,
        assetName: asset.name,
        assetSymbol: asset.symbol,
        amount: rewardAmount,
        sender: "staking_contract", // Would be the staking contract address in a real app
        recipient: "user_wallet", // Would be the user's wallet in a real app
        status: "confirmed",
        timestamp: now,
        stakingId: pool.id,
      };
      
      const validatedTransaction = insertTransactionSchema.parse(transaction);
      await storage.createTransaction(validatedTransaction);
      
      res.status(200).json({
        rewardsClaimed: rewardAmount,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to claim rewards" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
