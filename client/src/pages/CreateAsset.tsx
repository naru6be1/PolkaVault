import { useState } from "react";
import { usePolkadot } from "@/hooks/use-polkadot";
import { createAssetSchema } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CreateAsset() {
  const { selectedAccount } = usePolkadot();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof createAssetSchema>>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      name: "",
      symbol: "",
      decimals: 12,
      initialSupply: "1000",
      minBalance: "1",
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: (values: z.infer<typeof createAssetSchema>) => {
      return apiRequest("POST", "/api/assets", values);
    },
    onSuccess: () => {
      toast({
        title: "Asset Created",
        description: "Your new asset has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create asset: ${error.message}`,
      });
    },
  });

  function onSubmit(values: z.infer<typeof createAssetSchema>) {
    createAssetMutation.mutate(values);
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
          <CardTitle>Create New Asset</CardTitle>
          <CardDescription>
            Create a new asset on the Polkadot Asset Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Creating a new asset requires a deposit that will be locked until the asset is destroyed.
              Transaction fees will apply.
            </AlertDescription>
          </Alert>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter asset name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The full name of your asset (e.g. "Polkadot")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter asset symbol" {...field} />
                    </FormControl>
                    <FormDescription>
                      The symbol or ticker of your asset (e.g. "DOT"). Max 10 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="decimals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decimals</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter decimals (e.g. 12)" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The number of decimal places for your asset. Common values are 12 (DOT) or 18 (most tokens).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="initialSupply"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Supply</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter initial supply" {...field} />
                    </FormControl>
                    <FormDescription>
                      The initial amount of tokens to create. This will be sent to your account.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="minBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Balance</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter minimum balance" {...field} />
                    </FormControl>
                    <FormDescription>
                      Minimum balance required to hold this asset (existential deposit).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={createAssetMutation.isPending}
              >
                {createAssetMutation.isPending ? "Creating..." : "Create Asset"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
