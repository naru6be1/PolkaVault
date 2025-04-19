import { useState } from "react";
import { usePolkadot } from "@/hooks/use-polkadot";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Asset } from "@shared/schema";
import { transferSchema } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import WalletConnect from "@/components/WalletConnect";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatBalance } from "@/lib/utils";

export default function Transfer() {
  const { selectedAccount } = usePolkadot();
  const { toast } = useToast();
  
  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    enabled: !!selectedAccount,
  });

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      assetId: "",
      recipient: "",
      amount: "",
    },
  });

  const selectedAssetId = form.watch("assetId");
  const selectedAsset = assets?.find(a => a.assetId === selectedAssetId);

  const transferMutation = useMutation({
    mutationFn: (values: z.infer<typeof transferSchema>) => {
      return apiRequest("POST", "/api/transfer", values);
    },
    onSuccess: () => {
      toast({
        title: "Transfer Successful",
        description: "Your transfer has been processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: `Failed to transfer asset: ${error.message}`,
      });
    },
  });

  function onSubmit(values: z.infer<typeof transferSchema>) {
    transferMutation.mutate(values);
  }

  if (!selectedAccount) {
    return (
      <div className="max-w-3xl mx-auto">
        <WalletConnect />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Transfer Assets</CardTitle>
          <CardDescription>
            Send your assets to another address on the Polkadot Asset Hub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoading || assets?.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets?.map((asset) => (
                          <SelectItem key={asset.assetId} value={asset.assetId}>
                            {asset.name} ({asset.symbol}) - Balance: {formatBalance(asset.balance, asset.decimals)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {assets?.length === 0 && (
                      <FormDescription>
                        You don't have any assets to transfer. Create an asset first.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter recipient address" {...field} />
                    </FormControl>
                    <FormDescription>
                      The address of the recipient on the Polkadot Asset Hub.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter amount to transfer" {...field} />
                    </FormControl>
                    {selectedAsset && (
                      <FormDescription>
                        Available balance: {formatBalance(selectedAsset.balance, selectedAsset.decimals)} {selectedAsset.symbol}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={transferMutation.isPending || !selectedAsset}
              >
                {transferMutation.isPending ? "Processing..." : "Transfer"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
