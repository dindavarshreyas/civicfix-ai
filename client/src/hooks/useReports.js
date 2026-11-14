import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useUserReports(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['user-reports', page, pageSize],
    queryFn: () => api.get('/reports', { page, pageSize }),
  });
}

export function useReportDetail(reportId) {
  return useQuery({
    queryKey: ['report-detail', reportId],
    queryFn: () => api.get(`/reports/${reportId}`),
    enabled: !!reportId,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      return await api.post('/reports', formData, true); // multipart/form-data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
    },
  });
}
