import { useState } from 'react';
import { usePolkadot } from '@/hooks/use-polkadot';
import { verifyAssetOnChain, VerifiedAsset } from '@/lib/polkadot';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatAddressShort } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface AssetVerificationProps {
  assetId: string;
  assetName: string;
}

export default function AssetVerification({ assetId, assetName }: AssetVerificationProps) {
  const { api } = usePolkadot();
  const [verificationResult, setVerificationResult] = useState<VerifiedAsset | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleVerifyAsset = async () => {
    if (!api) return;
    
    setIsVerifying(true);
    try {
      const result = await verifyAssetOnChain(api, assetId);
      setVerificationResult(result);
    } catch (error) {
      console.error('Error verifying asset:', error);
      setVerificationResult({
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error verifying asset'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={() => {
            setDialogOpen(true);
            if (!verificationResult) {
              handleVerifyAsset();
            }
          }}
        >
          Verify On-Chain
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asset Verification</DialogTitle>
          <DialogDescription>
            Verify that asset {assetName} (ID: {assetId}) exists on the Polkadot blockchain.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isVerifying ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <span className="ml-2 text-gray-600">Verifying asset on blockchain...</span>
            </div>
          ) : verificationResult ? (
            verificationResult.exists ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-lg font-medium">Verification Status:</span>
                  <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
                    Verified ✓
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-md font-medium">On-Chain Details</h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Name:</div>
                    <div>{verificationResult.onChainDetails?.name}</div>
                    
                    <div className="font-medium">Symbol:</div>
                    <div>{verificationResult.onChainDetails?.symbol}</div>
                    
                    <div className="font-medium">Decimals:</div>
                    <div>{verificationResult.onChainDetails?.decimals}</div>
                    
                    <div className="font-medium">Total Supply:</div>
                    <div>{verificationResult.onChainDetails?.supply}</div>
                    
                    <div className="font-medium">Min Balance:</div>
                    <div>{verificationResult.onChainDetails?.minBalance}</div>
                    
                    <div className="font-medium">Owner:</div>
                    <div className="font-mono text-xs">
                      {formatAddressShort(verificationResult.onChainDetails?.owner || '')}
                    </div>
                    
                    <div className="font-medium">Admin:</div>
                    <div className="font-mono text-xs">
                      {formatAddressShort(verificationResult.onChainDetails?.admin || '')}
                    </div>
                    
                    <div className="font-medium">Issuer:</div>
                    <div className="font-mono text-xs">
                      {formatAddressShort(verificationResult.onChainDetails?.issuer || '')}
                    </div>
                    
                    <div className="font-medium">Account Holders:</div>
                    <div>{verificationResult.onChainDetails?.accounts}</div>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  <p>This asset's data has been verified directly from the Polkadot blockchain.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded-md">
                <p className="text-red-600 font-medium">Asset Not Found On-Chain</p>
                <p className="text-sm text-gray-600 mt-2">
                  This asset could not be found on the Polkadot blockchain. This could be due to:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600 mt-1">
                  <li>The asset has not been created yet</li>
                  <li>The asset ID is incorrect</li>
                  <li>Network connection issues</li>
                </ul>
                {verificationResult.error && (
                  <p className="text-xs font-mono mt-2 bg-gray-100 p-2 rounded">
                    Error: {verificationResult.error}
                  </p>
                )}
              </div>
            )
          ) : (
            <div className="p-4 bg-blue-50 rounded-md">
              <p>Click the button below to verify this asset on the blockchain.</p>
              <Button 
                className="mt-4" 
                onClick={handleVerifyAsset}
                disabled={isVerifying}
              >
                Verify Now
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}