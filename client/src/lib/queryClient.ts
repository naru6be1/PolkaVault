import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse as JSON first
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        throw {
          status: res.status,
          message: errorData.message || res.statusText,
          error: errorData.error || null,
          errors: errorData.errors || null
        };
      } else {
        // Fallback to text
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else if (typeof error === 'object' && error !== null) {
        throw { status: res.status, ...(error as Record<string, unknown>) };
      } else {
        throw new Error(`${res.status}: Unknown error`);
      }
    }
  }
}

export async function apiRequest(
  endpoint: string,
  options?: RequestInit,
): Promise<Response> {
  console.log(`API Request: ${options?.method || 'GET'} ${endpoint}`);
  try {
    const res = await fetch(endpoint, {
      method: options?.method || 'GET',
      headers: {
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
      body: options?.body,
      credentials: 'include',
      ...options,
    });

    console.log(`API Response: ${res.status} for ${endpoint}`);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log('Query key:', queryKey);
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      console.log(`Query response: ${res.status} for ${queryKey[0]}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      console.log('Query data:', data);
      return data;
    } catch (error) {
      console.error(`Query error for ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
