import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePolkadot } from "@/hooks/use-polkadot";
import { LiquidityPool, LiquidityPosition, Asset, ProvideLiquidityPayload } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { formatBalance } from "@/lib/utils";
import Header from "@/components/Header";
import StatusBanner from "@/components/StatusBanner";

export default function Liquidity() {
  const { toast } = useToast();
  const { api, selectedAccount, balance } = usePolkadot();
  const [activeTab, setActiveTab] = useState("myPools");

  // Get all liquidity pools
  const { data: liquidityPools, isLoading: isLoadingPools } = useQuery<LiquidityPool[]>({
    queryKey: ["/api/liquidity-pools"],
    enabled: !!api,
  });

  // Get user's liquidity positions
  const { data: myPositions, isLoading: isLoadingPositions } = useQuery<LiquidityPosition[]>({
    queryKey: ["/api/liquidity-positions"],
    enabled: !!selectedAccount,
  });
  
  // Get all available assets
  const { data: assets, isLoading: isLoadingAssets } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
    enabled: true,
  });

  // Form for creating a new pool
  // Debug available assets
  console.log("Available assets for pool creation:", assets);
  
  const createPoolForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Pool name is required"),
        assetAId: z.string().min(1, "First asset is required"),
        assetBId: z.string().min(1, "Second asset is required"),
        fee: z.number().min(0).max(1).default(0.003),
      })
    ),
    defaultValues: {
      name: "",
      assetAId: "",
      assetBId: "",
      fee: 0.003,
    },
  });

  // Form for providing liquidity
  const provideLiquidityForm = useForm({
    resolver: zodResolver(
      z.object({
        poolId: z.number().int().positive("Pool ID is required"),
        amountA: z.string().min(1, "Amount for first asset is required"),
        amountB: z.string().min(1, "Amount for second asset is required"),
      })
    ),
    defaultValues: {
      poolId: 0,
      amountA: "",
      amountB: "",
    },
  });

  // Form for withdrawing liquidity
  const withdrawLiquidityForm = useForm({
    resolver: zodResolver(
      z.object({
        positionId: z.number().int().positive("Position ID is required"),
        percentage: z.number().min(0.01).max(1).default(1),
      })
    ),
    defaultValues: {
      positionId: 0,
      percentage: 1,
    },
  });

  // Helper function for pool creation with retry logic
  const createPoolWithRetry = async (
    values: {
      name: string;
      assetAId: string;
      assetBId: string;
      fee: number;
    },
    maxRetries = 3
  ) => {
    let lastError = null;
    
    // Attempt the request up to maxRetries times
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Show attempt number if retrying
        if (attempt > 1) {
          console.log(`Retrying pool creation (attempt ${attempt}/${maxRetries})...`);
        }
        
        // Make the request directly to see raw response
        const fetchResponse = await fetch("/api/liquidity-pools", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });
        
        console.log(`Attempt ${attempt} - Raw response status:`, fetchResponse.status);
        
        // Display headers as simple object
        const headers: Record<string, string> = {};
        fetchResponse.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log(`Attempt ${attempt} - Raw response headers:`, headers);
        
        const responseText = await fetchResponse.text();
        console.log(`Attempt ${attempt} - Raw response body:`, responseText);
        
        let response;
        try {
          response = JSON.parse(responseText);
        } catch (e) {
          console.error(`Attempt ${attempt} - Failed to parse response as JSON:`, e);
          
          // If we got a 2xx status code but couldn't parse JSON, consider it a success
          // (might be empty response)
          if (fetchResponse.status >= 200 && fetchResponse.status < 300) {
            return { success: true, status: fetchResponse.status };
          }
          
          throw new Error("Invalid response format from server");
        }
        
        console.log(`Attempt ${attempt} - Parsed pool creation response:`, response);
        
        // Special handling for duplicate pool error (HTTP 409 Conflict)
        if (fetchResponse.status === 409) {
          console.log("Pool already exists, treating as a non-error condition");
          
          // We'll treat this as a "success" but with a different message
          // This prevents retries and displays a nicer message to the user
          return { 
            success: true,
            status: fetchResponse.status,
            message: response.message || "A pool already exists for these assets",
            existingPoolId: response.existingPoolId,
            alreadyExists: true
          };
        }
        
        if (!fetchResponse.ok) {
          throw new Error(response.message || response.error || "Failed to create pool");
        }
        
        // Success!
        return response;
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} - Error:`, error);
        
        // If we've hit the max retries, rethrow the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Should never get here due to the throw in the loop, but TypeScript needs this
    throw lastError;
  };
  
  const handleCreatePool = async (values: {
    name: string;
    assetAId: string;
    assetBId: string;
    fee: number;
  }) => {
    try {
      // Debug form validation state
      console.log("Form state:", createPoolForm.formState);
      console.log("Form errors:", createPoolForm.formState.errors);
      
      if (!api || !selectedAccount) {
        toast({
          title: "Error",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Creating pool with values:", values);
      
      // Check if assetAId and assetBId are the same
      if (values.assetAId === values.assetBId) {
        toast({
          title: "Error",
          description: "Cannot create a pool with the same asset on both sides",
          variant: "destructive",
        });
        return;
      }
      
      // Ensure we have valid asset IDs
      if (!values.assetAId || !values.assetBId) {
        toast({
          title: "Error",
          description: "Please select both assets for the pool",
          variant: "destructive",
        });
        return;
      }
      
      // Show loading toast
      toast({
        title: "Creating pool...",
        description: "Please wait while we create your liquidity pool",
      });

      // Use the retry function
      const response = await createPoolWithRetry(values);
      
      // Success! Invalidate the cache to refresh the pool list
      queryClient.invalidateQueries({ queryKey: ["/api/liquidity-pools"] });
      
      // Check if this was an "already exists" response
      if (response.alreadyExists) {
        toast({
          title: "Pool Already Exists",
          description: response.message || "A pool already exists for these assets",
          // Use a different variant - more of an info than error or success
          variant: "default"
        });
      } else {
        toast({
          title: "Success!",
          description: "Liquidity pool created successfully",
        });
      }

      createPoolForm.reset();
      setActiveTab("myPools");
    } catch (error: any) {
      console.error("Error creating pool:", error);
      
      // Extract more detailed error message if available
      const errorMessage = error?.message || error?.error || "Failed to create liquidity pool";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleProvideLiquidity = async (values: ProvideLiquidityPayload) => {
    try {
      if (!api || !selectedAccount) {
        toast({
          title: "Error",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Providing liquidity with values:", values);
      
      // Basic validation
      if (!values.amountA || !values.amountB) {
        toast({
          title: "Error",
          description: "Please enter amounts for both assets",
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest("/api/liquidity-positions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      console.log("Liquidity provision response:", response);

      toast({
        title: "Success!",
        description: "Liquidity provided successfully",
      });

      provideLiquidityForm.reset();
      setActiveTab("myPools");
    } catch (error: any) {
      console.error("Error providing liquidity:", error);
      
      // Extract more detailed error message if available
      const errorMessage = error?.message || error?.error || "Failed to provide liquidity";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleWithdrawLiquidity = async (values: { positionId: number; percentage: number }) => {
    try {
      if (!api || !selectedAccount) {
        toast({
          title: "Error",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Withdrawing liquidity with values:", values);
      
      // Validate position ID
      if (!values.positionId) {
        toast({
          title: "Error",
          description: "Invalid position ID",
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest(`/api/liquidity-positions/${values.positionId}/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ percentage: values.percentage }),
      });
      
      console.log("Withdraw liquidity response:", response);

      toast({
        title: "Success!",
        description: "Liquidity withdrawn successfully",
      });

      // Invalidate cache to refresh the positions
      queryClient.invalidateQueries({ queryKey: ["/api/liquidity-positions"] });
      withdrawLiquidityForm.reset();
    } catch (error: any) {
      console.error("Error withdrawing liquidity:", error);
      
      // Extract more detailed error message if available
      const errorMessage = error?.message || error?.error || "Failed to withdraw liquidity";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Helper function to get a pool's details
  const getPoolDetails = (poolId: number) => {
    return liquidityPools?.find((pool: LiquidityPool) => pool.id === poolId);
  };

  if (!selectedAccount) {
    return (
      <div className="container mx-auto p-4">
        <Header title="Liquidity Pools" />
        <StatusBanner 
          message="Please connect your wallet to access liquidity pools" 
          type="warning" 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Header title="Liquidity Pools" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="myPools">My Pools</TabsTrigger>
          <TabsTrigger value="allPools">All Pools</TabsTrigger>
          <TabsTrigger value="createPool">Create Pool</TabsTrigger>
        </TabsList>

        {/* My Pools Tab */}
        <TabsContent value="myPools">
          <div className="grid gap-4 md:grid-cols-2">
            {isLoadingPositions ? (
              <p>Loading your positions...</p>
            ) : myPositions?.length > 0 ? (
              myPositions.map((position: any) => {
                const pool = getPoolDetails(position.poolId);
                return (
                  <Card key={position.id}>
                    <CardHeader>
                      <CardTitle>{pool?.name || `Pool #${position.poolId}`}</CardTitle>
                      <CardDescription>Your liquidity position</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>LP Tokens:</span>
                          <span>{position.lpTokens}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Share:</span>
                          <span>{(position.sharePercentage * 100).toFixed(2)}%</span>
                        </div>
                        <Separator />
                        <Form {...withdrawLiquidityForm}>
                          <form onSubmit={withdrawLiquidityForm.handleSubmit(handleWithdrawLiquidity)} className="space-y-4">
                            <FormField
                              control={withdrawLiquidityForm.control}
                              name="positionId"
                              render={({ field }) => (
                                <FormItem hidden>
                                  <FormControl>
                                    <Input type="hidden" {...field} value={position.id} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={withdrawLiquidityForm.control}
                              name="percentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Withdraw Amount</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="range"
                                        min={0.01}
                                        max={1}
                                        step={0.01}
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                      />
                                      <span>{(field.value * 100).toFixed(0)}%</span>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full">Withdraw</Button>
                          </form>
                        </Form>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-2">
                <StatusBanner 
                  message="You don't have any liquidity positions yet. Add liquidity to a pool to get started." 
                  type="info" 
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* All Pools Tab */}
        <TabsContent value="allPools">
          <div className="grid gap-4 md:grid-cols-2">
            {isLoadingPools ? (
              <p>Loading pools...</p>
            ) : liquidityPools?.length > 0 ? (
              liquidityPools.map((pool: LiquidityPool) => (
                <Card key={pool.id}>
                  <CardHeader>
                    <CardTitle>{pool.name}</CardTitle>
                    <CardDescription>
                      Fee: {(pool.fee * 100).toFixed(2)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Reserve A:</span>
                        <span>{pool.reserveA}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reserve B:</span>
                        <span>{pool.reserveB}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LP Token Supply:</span>
                        <span>{pool.lpTokenSupply}</span>
                      </div>
                      <Separator className="my-2" />
                      <Form {...provideLiquidityForm}>
                        <form onSubmit={provideLiquidityForm.handleSubmit(handleProvideLiquidity)} className="space-y-4">
                          <FormField
                            control={provideLiquidityForm.control}
                            name="poolId"
                            render={({ field }) => (
                              <FormItem hidden>
                                <FormControl>
                                  <Input type="hidden" {...field} value={pool.id} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={provideLiquidityForm.control}
                            name="amountA"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount for Asset A</FormLabel>
                                <FormControl>
                                  <Input placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={provideLiquidityForm.control}
                            name="amountB"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount for Asset B</FormLabel>
                                <FormControl>
                                  <Input placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full">Provide Liquidity</Button>
                        </form>
                      </Form>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2">
                <StatusBanner 
                  message="No liquidity pools available. Create one to get started!" 
                  type="info" 
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Create Pool Tab */}
        <TabsContent value="createPool">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Liquidity Pool</CardTitle>
              <CardDescription>Create a new pool with two assets</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createPoolForm}>
                <form onSubmit={createPoolForm.handleSubmit(handleCreatePool)} className="space-y-4">
                  <FormField
                    control={createPoolForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pool Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Liquidity Pool" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createPoolForm.control}
                      name="assetAId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Asset</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select asset" />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingAssets ? (
                                  <SelectItem value="">Loading assets...</SelectItem>
                                ) : assets && assets.length > 0 ? (
                                  assets.map((asset: any) => (
                                    <SelectItem key={`A-${asset.assetId}`} value={asset.assetId}>
                                      {asset.name} ({asset.symbol})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="">No assets available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createPoolForm.control}
                      name="assetBId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Second Asset</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select asset" />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingAssets ? (
                                  <SelectItem value="">Loading assets...</SelectItem>
                                ) : assets && assets.length > 0 ? (
                                  assets.map((asset: any) => (
                                    <SelectItem key={`B-${asset.assetId}`} value={asset.assetId}>
                                      {asset.name} ({asset.symbol})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="">No assets available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createPoolForm.control}
                    name="fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Percentage</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="range"
                              min={0.001}
                              max={0.01}
                              step={0.001}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                            <span>{(field.value * 100).toFixed(1)}%</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">Create Pool</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}