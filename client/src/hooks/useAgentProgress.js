import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useAgentProgress(reportId) {
  return useQuery({
    queryKey: ['report-progress', reportId],
    queryFn: async () => {
      if (!reportId) return null;
      return await api.get(`/reports/${reportId}/progress`);
    },
    enabled: !!reportId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1500;
      if (data.state === 'processed' || data.state === 'failed') {
        return false; // Stop polling when finished
      }
      return 1500;
    },
    refetchIntervalInBackground: true,
  });
}
