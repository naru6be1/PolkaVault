import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddressShort, formatTimeAgo } from "@/lib/utils";
import { usePolkadot } from "@/hooks/use-polkadot";
import { StatusBadge } from "@/components/ui/status-badge";

export default function TransactionList({ limit }: { limit?: number }) {
  const { selectedAccount } = usePolkadot();
  
  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!selectedAccount,
  });

  if (!selectedAccount) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">Connect your wallet to view your transaction history</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
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
        <p className="text-red-500">Error loading transaction history. Please try again.</p>
      </div>
    );
  }

  const displayTransactions = limit 
    ? transactions?.slice(0, limit) 
    : transactions;

  if (displayTransactions?.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction Hash</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayTransactions?.map((tx) => (
              <TableRow key={tx.hash}>
                <TableCell>
                  <div className="text-sm font-mono text-gray-900 truncate max-w-xs">
                    {formatAddressShort(tx.hash)}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={tx.type} />
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {tx.assetName} ({tx.assetSymbol})
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {tx.amount}
                </TableCell>
                <TableCell>
                  <StatusBadge status={tx.status} />
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatTimeAgo(tx.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
