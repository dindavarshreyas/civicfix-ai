import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Polling every 30s as per Amendment A
  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.get('/notifications'),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  return {
    ...query,
    notifications: query.data?.notifications || [],
    unreadCount: query.data?.unreadCount || 0,
    markRead,
    markAllRead,
  };
}
