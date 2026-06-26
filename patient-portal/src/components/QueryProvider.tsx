"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Client Provider component that registers a stable QueryClient instance.
 *
 * Inputs:
 *   children (React.ReactNode): Child layout nodes.
 *
 * Outputs:
 *   React.JSX.Element: Rendered provider container.
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  // Use state to instantiate once per browser context and avoid layout re-creates
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // Prevents excessive scheduling API calls on tab change
            retry: 1,                    // Retries failed API calls once before reporting error
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
