import { useQuery } from '@tanstack/react-query';
import { OkrItem } from '@/types';

export function useSearch(query: string) {
  return useQuery<OkrItem[]>({
    queryKey: ['search', query],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json()),
    enabled: query.length >= 2,
  });
}
