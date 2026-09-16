import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { DebugBadge } from '@/components/DebugBadge'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false, staleTime: 60_000 },
        },
      }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <DebugBadge />
    </QueryClientProvider>
  )
}
