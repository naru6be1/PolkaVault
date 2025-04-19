import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { usePolkadot } from "@/hooks/use-polkadot";
import { StakingPool, StakeAssetsPayload } from "@shared/schema";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { z } from "zod";
import { formatBalance } from "@/lib/utils";
import Header from "@/components/Header";
import StatusBanner from "@/components/StatusBanner";
import { Progress } from "@/components/ui/progress";

export default function Staking() {
  const { toast } = useToast();
  const { api, selectedAccount, balance } = usePolkadot();
  const [activeTab, setActiveTab] = useState("myPositions");
  const [unstakeDialogOpen, setUnstakeDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const queryClient = useQueryClient();

  // Get all staking pools
  const { data: stakingPools = [], isLoading: isLoadingPools } = useQuery<StakingPool[]>({
    queryKey: ["/api/staking-pools"],
    enabled: !!api,
  });

  // Get user's staking positions
  const { data: myPositions = [], isLoading: isLoadingPositions } = useQuery<any[]>({
    queryKey: ["/api/staking-positions"],
    enabled: !!selectedAccount,
  });
  
  // Mutations
  const createPoolMutation = useMutation({
    mutationFn: async (values: {
      name: string;
      assetId: string;
      rewardRate: number;
      minStakeAmount: string;
      lockPeriodDays: number;
    }) => {
      return apiRequest("/api/staking-pools", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staking-pools"] });
      toast({
        title: "Success!",
        description: "Staking pool created successfully",
      });
      createPoolForm.reset();
      setActiveTab("allPools");
    },
    onError: (error) => {
      console.error("Error creating staking pool:", error);
      toast({
        title: "Error",
        description: "Failed to create staking pool",
        variant: "destructive",
      });
    }
  });
  
  const stakeMutation = useMutation({
    mutationFn: async (values: StakeAssetsPayload) => {
      return apiRequest("/api/staking-positions", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staking-positions"] });
      toast({
        title: "Success!",
        description: "Assets staked successfully",
      });
      stakeForm.reset();
      setActiveTab("myPositions");
    },
    onError: (error) => {
      console.error("Error staking assets:", error);
      toast({
        title: "Error",
        description: "Failed to stake assets",
        variant: "destructive",
      });
    }
  });
  
  const unstakeMutation = useMutation({
    mutationFn: async (values: { positionId: number; amount: string }) => {
      return apiRequest(`/api/staking-positions/${values.positionId}/unstake`, {
        method: "POST",
        body: JSON.stringify({ amount: values.amount }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staking-positions"] });
      toast({
        title: "Success!",
        description: "Assets unstaked successfully",
      });
      unstakeForm.reset();
    },
    onError: (error) => {
      console.error("Error unstaking assets:", error);
      toast({
        title: "Error",
        description: "Failed to unstake assets",
        variant: "destructive",
      });
    }
  });
  
  const claimRewardsMutation = useMutation({
    mutationFn: async (positionId: number) => {
      return apiRequest(`/api/staking-positions/${positionId}/claim-rewards`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staking-positions"] });
      toast({
        title: "Success!",
        description: "Rewards claimed successfully",
      });
    },
    onError: (error) => {
      console.error("Error claiming rewards:", error);
      toast({
        title: "Error",
        description: "Failed to claim rewards",
        variant: "destructive",
      });
    }
  });

  // Form for creating a new staking pool
  const createPoolForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Pool name is required"),
        assetId: z.string().min(1, "Asset is required"),
        rewardRate: z.number().min(0.01).max(1000),
        minStakeAmount: z.string().default("1"),
        lockPeriodDays: z.number().int().min(0).default(0),
      })
    ),
    defaultValues: {
      name: "",
      assetId: "",
      rewardRate: 5, // 5% APR
      minStakeAmount: "1",
      lockPeriodDays: 0,
    },
  });

  // Form for staking assets
  const stakeForm = useForm({
    resolver: zodResolver(
      z.object({
        poolId: z.number().int().positive("Pool ID is required"),
        amount: z.string().min(1, "Amount is required"),
      })
    ),
    defaultValues: {
      poolId: 1, // Default to the first pool ID
      amount: "",
    },
  });

  // Form for unstaking assets
  const unstakeForm = useForm({
    resolver: zodResolver(
      z.object({
        positionId: z.number().int().positive("Position ID is required"),
        amount: z.string().min(1, "Amount is required"),
      })
    ),
    defaultValues: {
      positionId: 0,
      amount: "",
    },
  });

  const handleCreatePool = async (values: {
    name: string;
    assetId: string;
    rewardRate: number;
    minStakeAmount: string;
    lockPeriodDays: number;
  }) => {
    if (!api || !selectedAccount) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    createPoolMutation.mutate(values);
  };

  const handleStake = async (values: StakeAssetsPayload) => {
    if (!api || !selectedAccount) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    stakeMutation.mutate(values);
  };

  const handleUnstake = async (values: { positionId: number; amount: string }) => {
    if (!api || !selectedAccount) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    unstakeMutation.mutate(values);
  };

  const handleClaimRewards = async (positionId: number) => {
    if (!api || !selectedAccount) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    claimRewardsMutation.mutate(positionId);
  };

  // Helper function to get a pool's details
  const getPoolDetails = (poolId: number) => {
    return stakingPools?.find((pool: StakingPool) => pool.id === poolId);
  };

  if (!selectedAccount) {
    return (
      <div className="container mx-auto p-4">
        <Header title="Staking" />
        <StatusBanner 
          message="Please connect your wallet to access staking features" 
          type="warning" 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Header title="Staking" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="myPositions">My Positions</TabsTrigger>
          <TabsTrigger value="allPools">Staking Pools</TabsTrigger>
          <TabsTrigger value="createPool">Create Pool</TabsTrigger>
        </TabsList>

        {/* My Positions Tab */}
        <TabsContent value="myPositions">
          <div className="grid gap-4 md:grid-cols-2">
            {isLoadingPositions ? (
              <p>Loading your positions...</p>
            ) : myPositions?.length > 0 ? (
              myPositions.map((position: any) => {
                const pool = getPoolDetails(position.poolId);
                return (
                  <Card key={position.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                      <CardTitle>{pool?.name || `Pool #${position.poolId}`}</CardTitle>
                      <CardDescription>
                        APR: {pool?.rewardRate}% • Lock period: {pool?.lockPeriodDays || 'No'} days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>Staked Amount</span>
                            <span>Rewards Earned</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>{position.stakedAmount}</span>
                            <span className="text-green-600">{position.rewardEarned}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Staking Progress</span>
                            <span>
                              {position.endDate 
                                ? `${Math.floor((new Date().getTime() - new Date(position.startDate).getTime()) / 
                                    (new Date(position.endDate).getTime() - new Date(position.startDate).getTime()) * 100)}%`
                                : 'Ongoing'}
                            </span>
                          </div>
                          {position.endDate && (
                            <Progress 
                              value={Math.floor((new Date().getTime() - new Date(position.startDate).getTime()) / 
                                (new Date(position.endDate).getTime() - new Date(position.startDate).getTime()) * 100)} 
                            />
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedPosition(position);
                              unstakeForm.setValue("positionId", position.id);
                              unstakeForm.setValue("amount", position.stakedAmount);
                              setUnstakeDialogOpen(true);
                            }}
                          >
                            Unstake
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={() => handleClaimRewards(position.id)}
                            disabled={Number(position.rewardEarned) <= 0}
                          >
                            Claim Rewards
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-2">
                <StatusBanner 
                  message="You don't have any staking positions yet. Stake your assets to earn rewards." 
                  type="info" 
                />
              </div>
            )}
          </div>

          {/* Unstake Dialog */}
          <Dialog open={unstakeDialogOpen} onOpenChange={setUnstakeDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Unstake Assets</DialogTitle>
                <DialogDescription>
                  {selectedPosition && (
                    <>
                      Unstake from {getPoolDetails(selectedPosition.poolId)?.name || `Pool #${selectedPosition.poolId}`}.
                      Current staked amount: {selectedPosition.stakedAmount}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...unstakeForm}>
                <form onSubmit={unstakeForm.handleSubmit(handleUnstake)} className="space-y-4">
                  <FormField
                    control={unstakeForm.control}
                    name="positionId"
                    render={({ field }) => (
                      <FormItem hidden>
                        <FormControl>
                          <Input type="hidden" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={unstakeForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount to Unstake</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setUnstakeDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      onClick={() => {
                        if (unstakeForm.formState.isValid) {
                          setUnstakeDialogOpen(false);
                        }
                      }}
                    >
                      Unstake
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* All Pools Tab */}
        <TabsContent value="allPools">
          <div className="grid gap-4 md:grid-cols-2">
            {isLoadingPools ? (
              <p>Loading staking pools...</p>
            ) : stakingPools?.length > 0 ? (
              stakingPools.map((pool: StakingPool) => (
                <Card key={pool.id}>
                  <CardHeader>
                    <CardTitle>{pool.name}</CardTitle>
                    <CardDescription>
                      APR: {pool.rewardRate}% • Min Stake: {pool.minStakeAmount}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Asset</span>
                          <span>Total Staked</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>{pool.assetId}</span>
                          <span>{pool.totalStaked}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Lock Period</span>
                          <span>Status</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>{pool.lockPeriodDays > 0 ? `${pool.lockPeriodDays} days` : 'No lock'}</span>
                          <span className="text-green-600">Active</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Amount to Stake
                          </label>
                          <div className="mt-2">
                            <Input 
                              placeholder="0.00" 
                              id={`stake-amount-${pool.id}`}
                              defaultValue=""
                            />
                          </div>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => {
                            const amountInput = document.getElementById(`stake-amount-${pool.id}`) as HTMLInputElement;
                            const amount = amountInput?.value || '';
                            
                            if (!amount) {
                              toast({
                                title: "Error",
                                description: "Please enter an amount to stake",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            console.log('Staking:', { poolId: pool.id, amount });
                            handleStake({ poolId: pool.id, amount });
                          }}
                        >
                          Stake
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2">
                <StatusBanner 
                  message="No staking pools available. Create one to get started!" 
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
              <CardTitle>Create a New Staking Pool</CardTitle>
              <CardDescription>Set up a staking pool for your asset</CardDescription>
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
                          <Input placeholder="My Staking Pool" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createPoolForm.control}
                    name="assetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* This would come from a query to get all assets */}
                              <SelectItem value="asset1">Asset 1</SelectItem>
                              <SelectItem value="asset2">Asset 2</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createPoolForm.control}
                    name="rewardRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Reward Rate (%)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              type="range"
                              min={0.1}
                              max={100}
                              step={0.1}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                            <span>{field.value.toFixed(1)}%</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createPoolForm.control}
                    name="minStakeAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Stake Amount</FormLabel>
                        <FormControl>
                          <Input placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createPoolForm.control}
                    name="lockPeriodDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lock Period (days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0}
                            placeholder="0 (no lock)" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">Create Staking Pool</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}