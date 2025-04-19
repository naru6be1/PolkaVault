import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, BarChart, Wallet } from "lucide-react";
import { usePolkadot } from "@/hooks/use-polkadot";
import { formatBalance } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletOverview() {
  const { selectedAccount, balance } = usePolkadot();

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['/api/assets'],
    enabled: !!selectedAccount,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: !!selectedAccount,
  });

  const isLoading = assetsLoading || transactionsLoading;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-pink-100">
              <Wallet className="h-6 w-6 text-pink-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Balance</h2>
              {selectedAccount ? (
                isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{formatBalance(balance, 12)} DOT</p>
                )
              ) : (
                <p className="text-2xl font-semibold text-gray-900">-- DOT</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-purple-100">
              <CreditCard className="h-6 w-6 text-purple-700" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Assets</h2>
              {selectedAccount ? (
                isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{assets?.length || 0}</p>
                )
              ) : (
                <p className="text-2xl font-semibold text-gray-900">--</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-100">
              <BarChart className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Recent Transactions</h2>
              {selectedAccount ? (
                isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{transactions?.length || 0}</p>
                )
              ) : (
                <p className="text-2xl font-semibold text-gray-900">--</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
