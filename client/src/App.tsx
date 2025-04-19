import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import MyAssets from "@/pages/MyAssets";
import Transfer from "@/pages/Transfer";
import CreateAsset from "@/pages/CreateAsset";
import TransactionHistory from "@/pages/TransactionHistory";
import Settings from "@/pages/Settings";
import AssetDetails from "@/pages/AssetDetails";
import Sidebar from "@/components/ui/sidebar";
import { PolkadotProvider } from "@/hooks/use-polkadot";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

function Router() {
  const [location] = useLocation();
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const path = location.split("/")[1];
    switch (path) {
      case "":
        setPageTitle("Dashboard");
        break;
      case "assets":
        setPageTitle("My Assets");
        break;
      case "asset":
        setPageTitle("Asset Details");
        break;
      case "transfer":
        setPageTitle("Transfer");
        break;
      case "create":
        setPageTitle("Create Asset");
        break;
      case "transactions":
        setPageTitle("Transaction History");
        break;
      case "settings":
        setPageTitle("Settings");
        break;
      default:
        setPageTitle("Dashboard");
    }
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="md:hidden">
              <button 
                type="button" 
                className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div className="flex-1 flex items-center justify-between px-4">
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
              </div>
              <div className="ml-4 flex items-center">
                <div className="relative">
                  <button className="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md max-w-xs truncate">
                      {/* This will be filled by the Polkadot hook */}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/assets" component={MyAssets} />
            <Route path="/asset/:assetId" component={AssetDetails} />
            <Route path="/transfer" component={Transfer} />
            <Route path="/create" component={CreateAsset} />
            <Route path="/transactions" component={TransactionHistory} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <PolkadotProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </PolkadotProvider>
  );
}

export default App;
