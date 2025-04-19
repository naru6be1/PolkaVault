import { X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

type StatusType = "success" | "info" | "error" | "warning";

type StatusBannerProps = {
  message: string;
  type?: StatusType;
  showDismiss?: boolean;
};

export default function StatusBanner({ 
  message, 
  type = "success", 
  showDismiss = true 
}: StatusBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const getBannerStyles = () => {
    switch (type) {
      case "success":
        return {
          className: "bg-green-100 border border-green-500 text-gray-900",
          icon: <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
        };
      case "error":
        return {
          className: "bg-red-100 border border-red-500 text-gray-900",
          icon: <XCircle className="h-5 w-5 text-red-500 mr-2" />
        };
      case "warning":
        return {
          className: "bg-yellow-100 border border-yellow-500 text-gray-900",
          icon: <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
        };
      case "info":
      default:
        return {
          className: "bg-blue-100 border border-blue-500 text-gray-900",
          icon: <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
        };
    }
  };

  const { className, icon } = getBannerStyles();

  return (
    <div className="mb-4">
      <Alert className={className}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {icon}
            <AlertDescription className="text-sm">{message}</AlertDescription>
          </div>
          {showDismiss && (
            <button 
              onClick={() => setVisible(false)} 
              className="text-gray-700 hover:text-pink-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </Alert>
    </div>
  );
}
