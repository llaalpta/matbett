"use client";

import { ToastProvider } from "@/components/feedback/ToastProvider";
import { AppTRPCProvider } from "@/providers/trpc-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AppTRPCProvider>
      <ToastProvider>{children}</ToastProvider>
    </AppTRPCProvider>
  );
}
