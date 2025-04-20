import { useState, useEffect } from "react";
import StatusBanner from "@/components/StatusBanner";
import WalletOverview from "@/components/WalletOverview";
import AssetList from "@/components/AssetList";
import TransactionList from "@/components/TransactionList";
import { Button } from "@/components/ui/button";
import { usePolkadot } from "@/hooks/use-polkadot";
import AssetModal from "@/components/AssetModal";
import { Link } from "wouter";
import WalletConnect from "@/components/WalletConnect";

export default function Dashboard() {
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const { selectedAccount, initialized } = usePolkadot();
  const [showConnectionSuccess, setShowConnectionSuccess] = useState(false);

  useEffect(() => {
    if (selectedAccount && initialized) {
      setShowConnectionSuccess(true);
      const timer = setTimeout(() => {
        setShowConnectionSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedAccount, initialized]);

  if (!selectedAccount) {
    return (
      <div className="max-w-3xl mx-auto">
        <WalletConnect />
      </div>
    );
  }

  return (
    <>
      {showConnectionSuccess && (
        <StatusBanner 
          message="Successfully connected to PolkaVault" 
          type="success"
        />
      )}
      
      <WalletOverview />
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">My Assets</h2>
          <Button onClick={() => setIsAssetModalOpen(true)}>
            Create New Asset
          </Button>
        </div>
        
        <AssetList />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
          <Link href="/transactions" className="text-pink-500 hover:text-purple-700 text-sm font-medium">
            View All
          </Link>
        </div>
        
        <TransactionList limit={4} />
      </div>
      
      <AssetModal 
        isOpen={isAssetModalOpen} 
        onClose={() => setIsAssetModalOpen(false)} 
      />
    </>
  );
}
