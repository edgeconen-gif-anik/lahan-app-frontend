"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SessionIdleManager } from "@/components/auth/session-idle-manager";
import { Toaster } from "@/components/ui/sonner";

const NIGHT_START_HOUR = 19;
const NIGHT_END_HOUR = 6;

function getScheduledTheme() {
  const hour = new Date().getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR ? "dark" : "light";
}

function AutoNightThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const syncTheme = () => {
      setTheme(getScheduledTheme());
    };

    syncTheme();
    const intervalId = window.setInterval(syncTheme, 15 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [setTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client exactly once per application lifecycle
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  }));

  return (
    <SessionProvider>
      <SessionIdleManager />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AutoNightThemeSync />
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
