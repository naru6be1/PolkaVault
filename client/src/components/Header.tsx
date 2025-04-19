import { usePolkadot } from "@/hooks/use-polkadot";
import { formatAddressShort } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderProps = {
  title: string;
};

export default function Header({ title }: HeaderProps) {
  const { selectedAccount, accounts, selectAccount, disconnectWallet } = usePolkadot();

  return (
    <header className="bg-white shadow">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="md:hidden">
          <button 
            type="button" 
            className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-between px-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          <div className="ml-4 flex items-center">
            {selectedAccount ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md max-w-xs truncate">
                    {formatAddressShort(selectedAccount.address)}
                  </span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {accounts.map((account) => (
                    <DropdownMenuItem 
                      key={account.address}
                      onClick={() => selectAccount(account)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{account.meta.name}</span>
                        <span className="text-xs font-mono text-gray-500">
                          {formatAddressShort(account.address)}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem 
                    onClick={disconnectWallet}
                    className="text-red-500 hover:text-red-700"
                  >
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="text-sm text-gray-500">Not connected</div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
