"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { ToastProvider } from "./components/ui/toast";
import { getErrorMessage, isNetworkError, isAuthError } from "./lib/errorUtils";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on auth errors
          if (isAuthError(error)) return false;
          
          // Retry network errors up to 2 times
          if (isNetworkError(error)) return failureCount < 2;
          
          // Retry other errors once
          return failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry mutations on auth or validation errors
          if (isAuthError(error) || (error as any)?.response?.status === 400) {
            return false;
          }
          
          // Retry network errors once
          if (isNetworkError(error)) return failureCount < 1;
          
          return false;
        },
        onError: (error) => {
          // Global error handling for mutations can be added here
        }
      }
    }
  }));

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
