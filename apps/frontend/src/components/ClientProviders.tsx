'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ChatbotWidget from './ChatbotWidget';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // useState keeps the QueryClient stable across renders (one instance per session)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,   // data stays fresh for 5 min — no refetch on tab focus
        gcTime: 10 * 60 * 1000,      // keep unused data in cache for 10 min
        retry: 1,                     // one retry on failure, then fallback
        refetchOnWindowFocus: false,  // don't refetch every time user switches tabs
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          {children}
          <ChatbotWidget />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
