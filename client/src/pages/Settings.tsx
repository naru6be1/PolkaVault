import { usePolkadot } from "@/hooks/use-polkadot";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Settings form schema
const settingsFormSchema = z.object({
  network: z.string({
    required_error: "Please select a network.",
  }),
  theme: z.string({
    required_error: "Please select a theme.",
  }),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// Default values for the form
const defaultValues: Partial<SettingsFormValues> = {
  network: "asset-hub",
  theme: "light",
};

export default function Settings() {
  const { selectedAccount } = usePolkadot();
  const { toast } = useToast();
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues,
  });

  function onSubmit(data: SettingsFormValues) {
    toast({
      title: "Settings Updated",
      description: "Your settings have been updated successfully.",
    });
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
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your application preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="network"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a network" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="asset-hub">Asset Hub (Polkadot)</SelectItem>
                        <SelectItem value="asset-hub-kusama">Asset Hub (Kusama)</SelectItem>
                        <SelectItem value="asset-hub-westend">Asset Hub (Westend)</SelectItem>
                        <SelectItem value="local">Local Node</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select which network to connect to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select your preferred theme
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit">Save Settings</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
