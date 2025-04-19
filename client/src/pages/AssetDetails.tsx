import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Asset } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { usePolkadot } from '@/hooks/use-polkadot';
import { formatBalance, formatAddressShort } from '@/lib/utils';
import AssetVerification from '@/components/AssetVerification';
import { ArrowLeft, Send, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

export default function AssetDetails() {
  // Get assetId from URL params
  const [match, params] = useRoute('/asset/:assetId');
  const assetId = params?.assetId;
  
  console.log('AssetDetails - Route match:', match);
  console.log('AssetDetails - Params:', params);
  console.log('AssetDetails - assetId:', assetId);
  
  const { selectedAccount } = usePolkadot();
  
  // Need to encode the assetId for the API call since it may contain special characters like #
  const encodedAssetId = assetId ? encodeURIComponent(assetId) : '';
  console.log('AssetDetails - encodedAssetId:', encodedAssetId);
  
  const { data: asset, isLoading, error } = useQuery<Asset>({
    queryKey: [`/api/assets/${encodedAssetId}`],
    enabled: !!assetId,
  });

  if (!selectedAccount) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to view asset details</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading asset details...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (error || !asset) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Asset Not Found</CardTitle>
            <CardDescription>
              The asset with ID {assetId} could not be loaded or does not exist.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/assets">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Assets
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const getExplorerUrl = (assetId: string) => {
    // Use Subscan for Westend testnet
    return `https://westend.subscan.io/asset/${assetId}`;
  };
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-4">
        <Link href="/assets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Assets
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{asset.name}</CardTitle>
              <CardDescription>
                <span className="font-medium text-gray-600">{asset.symbol}</span>
                <span className="mx-2">•</span>
                <span className="font-mono text-sm">{asset.assetId}</span>
              </CardDescription>
            </div>
            <AssetVerification assetId={asset.assetId} assetName={asset.name} />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Balance</h3>
              <p className="text-3xl font-bold">
                {formatBalance(asset.balance, asset.decimals)} {asset.symbol}
              </p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Asset Information</h3>
                <dl className="grid grid-cols-2 gap-2">
                  <dt className="text-sm font-medium text-gray-600">Asset ID:</dt>
                  <dd className="text-sm font-mono">{asset.assetId}</dd>
                  
                  <dt className="text-sm font-medium text-gray-600">Symbol:</dt>
                  <dd className="text-sm">{asset.symbol}</dd>
                  
                  <dt className="text-sm font-medium text-gray-600">Decimals:</dt>
                  <dd className="text-sm">{asset.decimals}</dd>
                  
                  <dt className="text-sm font-medium text-gray-600">Created On:</dt>
                  <dd className="text-sm">{new Date(asset.createdAt).toLocaleString()}</dd>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Ownership</h3>
                <dl className="grid grid-cols-1 gap-2">
                  <dt className="text-sm font-medium text-gray-600">Creator:</dt>
                  <dd className="text-sm font-mono">{formatAddressShort(asset.creator)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <a 
                href={getExplorerUrl(asset.assetId)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
              >
                View in Explorer <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          
          <Link href={`/transfer?assetId=${asset.assetId}`}>
            <Button className="flex items-center">
              <Send className="mr-2 h-4 w-4" />
              Transfer
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}