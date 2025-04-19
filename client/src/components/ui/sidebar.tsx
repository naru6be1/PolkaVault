import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { usePolkadot } from '@/hooks/use-polkadot';
import { Home, CreditCard, ArrowRightLeft, PlusCircle, FileText, Settings } from 'lucide-react';

export default function Sidebar() {
  const [location] = useLocation();
  const { selectedAccount, connectWallet, disconnectWallet } = usePolkadot();

  const isActive = (path: string) => {
    return location === path;
  };

  const menuItems = [
    { path: "/", icon: <Home className="h-5 w-5 mr-3" />, label: "Dashboard" },
    { path: "/assets", icon: <CreditCard className="h-5 w-5 mr-3" />, label: "My Assets" },
    { path: "/transfer", icon: <ArrowRightLeft className="h-5 w-5 mr-3" />, label: "Transfer" },
    { path: "/create", icon: <PlusCircle className="h-5 w-5 mr-3" />, label: "Create Asset" },
    { path: "/transactions", icon: <FileText className="h-5 w-5 mr-3" />, label: "Transaction History" },
    { path: "/settings", icon: <Settings className="h-5 w-5 mr-3" />, label: "Settings" },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 border-b">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-pink-500 rounded-full"></div>
            <span className="ml-2 text-lg font-semibold text-gray-900">Asset Hub</span>
          </div>
        </div>
        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
              >
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md group",
                    isActive(item.path) 
                      ? "text-white bg-pink-500" 
                      : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between bg-green-100 p-3 rounded-md">
            <div className="flex items-center">
              <div className={cn(
                "h-2 w-2 rounded-full",
                selectedAccount ? "bg-green-500" : "bg-gray-300"
              )}></div>
              <span className="ml-2 text-xs font-medium text-gray-900">
                {selectedAccount ? "Connected" : "Disconnected"}
              </span>
            </div>
            <button 
              className="text-xs text-pink-500 hover:text-purple-700"
              onClick={selectedAccount ? disconnectWallet : connectWallet}
            >
              {selectedAccount ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
