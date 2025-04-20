import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePolkadot } from "@/hooks/use-polkadot";
import AssetModal from "@/components/AssetModal";
import WalletConnect from "@/components/WalletConnect";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Asset } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBalance } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import AssetVerification from "@/components/AssetVerification";
import StatusBanner from "@/components/StatusBanner";

export default function MyAssets() {
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("allAssets");
  const { selectedAccount, api } = usePolkadot();

  // Query for all assets
  const { 
    data: assets, 
    isLoading: isLoadingAssets, 
    error: assetsError,
    refetch: refetchAssets
  } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    enabled: !!selectedAccount,
    // Ensure we don't use stale data
    staleTime: 0,
  });

  if (!selectedAccount) {
    return (
      <div className="max-w-3xl mx-auto">
        <WalletConnect />
      </div>
    );
  }

  const getAssetInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = [
      "bg-pink-100 text-pink-500",
      "bg-purple-100 text-purple-700",
      "bg-green-100 text-green-500",
      "bg-blue-100 text-blue-500",
      "bg-yellow-100 text-yellow-600",
    ];
    
    // Simple hash function to choose a consistent color for each asset
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">My Assets</h2>
        <Button onClick={() => setIsAssetModalOpen(true)}>
          Create New Asset
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="allAssets">All Assets</TabsTrigger>
          <TabsTrigger value="recentActivity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* All Assets Tab */}
        <TabsContent value="allAssets">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {isLoadingAssets ? (
              <div className="p-6">
                <Skeleton className="h-8 w-32 mb-4" />
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : assetsError ? (
              <div className="p-6 text-center">
                <p className="text-red-500">Error loading assets. Please try again.</p>
              </div>
            ) : assets?.length === 0 ? (
              <div className="p-6 text-center">
                <StatusBanner 
                  message="You don't have any assets yet. Create one to get started."
                  type="info"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets?.map((asset) => (
                      <TableRow key={asset.assetId}>
                        <TableCell className="font-mono text-gray-900">{asset.assetId}</TableCell>
                        <TableCell>
                          <Link href={`/asset/${encodeURIComponent(asset.assetId)}`}>
                            <div className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <div className={`h-8 w-8 rounded-full ${getRandomColor(asset.name)} flex items-center justify-center text-sm font-medium`}>
                                {getAssetInitials(asset.name)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                                <div className="text-xs text-gray-500">{asset.symbol}</div>
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-gray-900">
                          {formatBalance(asset.balance, asset.decimals)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Link href={`/transfer?assetId=${asset.assetId}`} className="text-pink-500 hover:text-purple-700">
                              <span className="whitespace-nowrap">Transfer</span>
                            </Link>
                            <AssetVerification assetId={asset.assetId} assetName={asset.name} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="recentActivity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Asset Activity</CardTitle>
              <CardDescription>Recent transactions and updates related to your assets</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusBanner 
                message="Transaction history will be available soon!" 
                type="info" 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AssetModal 
        isOpen={isAssetModalOpen} 
        onClose={() => setIsAssetModalOpen(false)}
        onAssetCreated={() => {
          console.log("Asset created callback in MyAssets - refreshing assets");
          refetchAssets();
        }}
      />
    </>
  );
}
