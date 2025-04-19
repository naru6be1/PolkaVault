import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddressShort(address: string): string {
  if (!address) return "";
  if (address.length <= 10) return address;
  
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimeAgo(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return `${interval} year${interval === 1 ? '' : 's'} ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return `${interval} month${interval === 1 ? '' : 's'} ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return `${interval} day${interval === 1 ? '' : 's'} ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return `${interval} hour${interval === 1 ? '' : 's'} ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return `${interval} minute${interval === 1 ? '' : 's'} ago`;
  }
  
  return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
}

export function formatBalance(balance: string, decimals: number): string {
  try {
    const value = BigInt(balance);
    const divisor = BigInt(10) ** BigInt(decimals);
    const beforeDecimal = value / divisor;
    const afterDecimal = value % divisor;
    
    const paddedAfterDecimal = afterDecimal.toString().padStart(decimals, '0');
    const formattedAfterDecimal = paddedAfterDecimal
      .replace(/0+$/, '') // Remove trailing zeros
      .slice(0, 2); // Keep only first 2 digits
      
    if (formattedAfterDecimal === '') {
      return beforeDecimal.toString();
    }
    
    return `${beforeDecimal}.${formattedAfterDecimal}`;
  } catch (e) {
    return balance;
  }
}
