import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { usePolkadot } from "@/hooks/use-polkadot";
import { LiquidityPool, ProvideLiquidityPayload, liquidityPools } from "@shared/schema";
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
  const { data: liquidityPools, isLoading: isLoadingPools } = useQuery({
    queryKey: ["/api/liquidity-pools"],
    enabled: !!api,
  });

  // Get user's liquidity positions
  const { data: myPositions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ["/api/liquidity-positions"],
    enabled: !!selectedAccount,
  });
  
  // Get all available assets
  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ["/api/assets"],
    enabled: true,
  });

  // Form for creating a new pool
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

  const handleCreatePool = async (values: {
    name: string;
    assetAId: string;
    assetBId: string;
    fee: number;
  }) => {
    try {
      if (!api || !selectedAccount) {
        toast({
          title: "Error",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return;
      }

      await apiRequest("/api/liquidity-pools", {
        method: "POST",
        body: JSON.stringify(values),
      });

      toast({
        title: "Success!",
        description: "Liquidity pool created successfully",
      });

      createPoolForm.reset();
      setActiveTab("myPools");
    } catch (error) {
      console.error("Error creating pool:", error);
      toast({
        title: "Error",
        description: "Failed to create liquidity pool",
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

      await apiRequest("/api/liquidity-positions", {
        method: "POST",
        body: JSON.stringify(values),
      });

      toast({
        title: "Success!",
        description: "Liquidity provided successfully",
      });

      provideLiquidityForm.reset();
      setActiveTab("myPools");
    } catch (error) {
      console.error("Error providing liquidity:", error);
      toast({
        title: "Error",
        description: "Failed to provide liquidity",
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

      await apiRequest(`/api/liquidity-positions/${values.positionId}/withdraw`, {
        method: "POST",
        body: JSON.stringify({ percentage: values.percentage }),
      });

      toast({
        title: "Success!",
        description: "Liquidity withdrawn successfully",
      });

      withdrawLiquidityForm.reset();
    } catch (error) {
      console.error("Error withdrawing liquidity:", error);
      toast({
        title: "Error",
        description: "Failed to withdraw liquidity",
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