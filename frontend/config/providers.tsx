"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvicer } from "jotai";

const queryClient = new QueryClient();

export default function Providers({ children }: React.PropsWithChildren) {
  return (
    <JotaiProvicer>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </JotaiProvicer>
  );
}
