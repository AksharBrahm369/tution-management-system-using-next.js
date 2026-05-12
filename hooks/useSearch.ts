import { useQuery } from '@tanstack/react-query';

export interface SearchResult {
  id: string;
  name: string;
  type: 'student' | 'teacher' | 'batch';
  link: string;
}

export function useSearch(query: string, enabled: boolean = true) {
  return useQuery<{ results: SearchResult[] }>({
    queryKey: ['search', query],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`/api/admin/search?${params}`);
      if (!response.ok) throw new Error('Failed to search');
      return response.json();
    },
    enabled: enabled && query.length > 1,
    staleTime: 30 * 1000, // 30 seconds
  });
}
