"use client";

import { AppTRPCProvider } from "@/providers/trpc-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <AppTRPCProvider>{children}</AppTRPCProvider>;
}
