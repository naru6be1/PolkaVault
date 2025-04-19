import { useState } from "react";
import AssetList from "@/components/AssetList";
import { Button } from "@/components/ui/button";
import { usePolkadot } from "@/hooks/use-polkadot";
import AssetModal from "@/components/AssetModal";
import WalletConnect from "@/components/WalletConnect";

export default function MyAssets() {
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const { selectedAccount } = usePolkadot();

  if (!selectedAccount) {
    return (
      <div className="max-w-3xl mx-auto">
        <WalletConnect />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">My Assets</h2>
        <Button onClick={() => setIsAssetModalOpen(true)}>
          Create New Asset
        </Button>
      </div>
      
      <AssetList />
      
      <AssetModal 
        isOpen={isAssetModalOpen} 
        onClose={() => setIsAssetModalOpen(false)} 
      />
    </>
  );
}
