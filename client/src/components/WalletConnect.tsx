import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePolkadot } from '@/hooks/use-polkadot';
import { Wallet, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WalletConnect() {
  const { 
    accounts, 
    selectedAccount, 
    connectWallet, 
    disconnectWallet, 
    selectAccount, 
    loading 
  } = usePolkadot();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connecting Wallet</CardTitle>
          <CardDescription>Please wait while we connect to your wallet</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!selectedAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Connect your Polkadot wallet to get started</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-500 mb-4">
            You need to connect your wallet to interact with Asset Hub. Make sure you have the Polkadot.js extension installed.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={connectWallet} className="w-full">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Connected</CardTitle>
        <CardDescription>Your wallet is connected to Asset Hub</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Selected Account</label>
            <Select
              value={selectedAccount.address}
              onValueChange={(value) => {
                const account = accounts.find(acc => acc.address === value);
                if (account) selectAccount(account);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.address} value={account.address}>
                    {account.meta.name} ({account.address.substring(0, 6)}...{account.address.substring(account.address.length - 4)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={disconnectWallet} className="w-full">
          Disconnect Wallet
        </Button>
      </CardFooter>
    </Card>
  );
}
