import TransactionList from "@/components/TransactionList";
import { usePolkadot } from "@/hooks/use-polkadot";
import WalletConnect from "@/components/WalletConnect";

export default function TransactionHistory() {
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
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
        <p className="text-sm text-gray-500">
          View all your transactions on the Polkadot Asset Hub
        </p>
      </div>
      
      <TransactionList />
    </>
  );
}
