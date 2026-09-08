import { QueryClient, QueryClientProvider as TanStackQueryProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return <TanStackQueryProvider client={queryClient}>{children}</TanStackQueryProvider>;
}
