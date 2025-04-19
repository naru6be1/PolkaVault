import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-500';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'failed':
        return 'bg-red-100 text-red-500';
      case 'transfer':
        return 'bg-pink-100 text-pink-500';
      case 'receive':
        return 'bg-blue-100 text-blue-500';
      case 'create':
        return 'bg-purple-100 text-purple-700';
      case 'fee':
        return 'bg-orange-100 text-orange-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <span 
      className={cn(
        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full", 
        getStatusColor(status),
        className
      )}
    >
      {status}
    </span>
  );
}
