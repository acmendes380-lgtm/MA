import { useQuery } from '@tanstack/react-query'

export function useAIInsight() {
  return useQuery({
    queryKey: ['ai-insight'],
    queryFn: async () => {
      const res = await fetch('/api/ai/daily-insight')
      if (!res.ok) throw new Error('Failed to fetch insight')
      const data = await res.json()
      return data.insight as string
    },
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
}
