import { useState } from "react";
import { 
  Dialog, 
  DialogContent,
  DialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createAssetSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type AssetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated?: () => void; // Optional callback for when an asset is created
};

export default function AssetModal({ isOpen, onClose, onAssetCreated }: AssetModalProps) {
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
      console.log("Creating asset with values:", values);
      return apiRequest("/api/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
    },
    onSuccess: (data) => {
      console.log("Asset created successfully:", data);
      toast({
        title: "Asset Created",
        description: "Your new asset has been created successfully",
      });
      // Force refresh the assets list to show the new asset
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Call the callback if provided
      if (onAssetCreated) {
        console.log("Calling onAssetCreated callback from mutation");
        onAssetCreated();
      }
      
      onClose();
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

  async function onSubmit(values: z.infer<typeof createAssetSchema>) {
    try {
      // Show a loading toast
      toast({
        title: "Creating asset...",
        description: "Please wait while we create your asset"
      });
      
      // Make the request directly to handle HTTP 409 responses properly
      const fetchResponse = await fetch("/api/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      console.log("Asset creation response status:", fetchResponse.status);
      const responseText = await fetchResponse.text();
      
      let response;
      try {
        response = JSON.parse(responseText);
        console.log("Asset creation response:", response);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        // Treat as a general error
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid response from server"
        });
        return;
      }

      // Special handling for duplicate asset (HTTP 409 Conflict)
      if (fetchResponse.status === 409) {
        console.log("Asset already exists, displaying appropriate message");
        toast({
          title: "Asset Already Exists",
          description: response.message || `An asset with name ${values.name} already exists`,
          variant: "default"
        });
      } else if (!fetchResponse.ok) {
        // Any other error status
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to create asset"
        });
      } else {
        // Success!
        toast({
          title: "Success!",
          description: "Asset created successfully",
        });
      }
      
      // Always invalidate queries and reset the form regardless of outcome
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      
      // If onAssetCreated callback was provided, call it to trigger refresh in parent component
      if (onAssetCreated && fetchResponse.ok) {
        console.log("Calling onAssetCreated callback to trigger parent refresh");
        onAssetCreated();
      }
      
      onClose();
      form.reset();
    } catch (error: any) {
      console.error("Error in asset creation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create asset"
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Asset</DialogTitle>
          <DialogDescription>
            Complete the form below to create a new asset on Asset Hub.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter asset name" {...field} />
                  </FormControl>
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
                      placeholder="Enter decimals (e.g. 18)" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
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
          
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createAssetMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createAssetMutation.isPending}
              >
                {createAssetMutation.isPending ? "Creating..." : "Create Asset"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
