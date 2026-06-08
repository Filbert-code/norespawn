import { QueryClient } from '@tanstack/react-query'

// One client per app. Defaults tuned for a single-user fitness app:
// - data changes rarely outside of user-driven mutations -> long staleTime
// - we drive most invalidation via mutation's onSuccess, so background polling
//   is unnecessary.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry RLS / 4xx errors — they won't fix themselves.
          const code = (error as { code?: string } | null)?.code
          if (code && /^4\d\d$/.test(code)) return false
          return failureCount < 2
        },
      },
      mutations: {
        retry: 0,
      },
    },
  })
}
