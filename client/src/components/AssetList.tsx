import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Asset } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBalance } from "@/lib/utils";
import { usePolkadot } from "@/hooks/use-polkadot";
import AssetVerification from "./AssetVerification";

export default function AssetList() {
  const { selectedAccount } = usePolkadot();
  
  const { data: assets, isLoading, error } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    enabled: !!selectedAccount,
  });

  if (!selectedAccount) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">Connect your wallet to view your assets</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-red-500">Error loading assets. Please try again.</p>
      </div>
    );
  }

  if (assets?.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">You don't have any assets yet. Create one to get started.</p>
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
    <div className="bg-white shadow rounded-lg overflow-hidden">
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
                  <Link href={`/asset/${encodeURIComponent(asset.assetId)}`} onClick={() => {
                    console.log('Asset clicked:', asset);
                    console.log('Navigating to:', `/asset/${encodeURIComponent(asset.assetId)}`);
                  }}>
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
    </div>
  );
}
