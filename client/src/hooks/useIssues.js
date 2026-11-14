import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function usePublicIssues(filters = {}) {
  return useQuery({
    queryKey: ['public-issues', filters],
    queryFn: () => api.get('/issues', filters),
  });
}

export function usePublicIssue(issueId) {
  return useQuery({
    queryKey: ['public-issue', issueId],
    queryFn: () => api.get(`/issues/${issueId}`),
    enabled: !!issueId,
  });
}

export function useOfficerIssueDetail(issueId) {
  return useQuery({
    queryKey: ['officer-issue-detail', issueId],
    queryFn: () => api.get(`/issues/${issueId}/detail`),
    enabled: !!issueId,
  });
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, status, note }) =>
      api.patch(`/issues/${issueId}/status`, { status, note }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['public-issues'] });
      queryClient.invalidateQueries({ queryKey: ['public-issue', variables.issueId] });
      queryClient.invalidateQueries({ queryKey: ['officer-issue-detail', variables.issueId] });
    },
  });
}

export function useReopenIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, note }) =>
      api.post(`/issues/${issueId}/reopen`, { note }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['public-issues'] });
      queryClient.invalidateQueries({ queryKey: ['public-issue', variables.issueId] });
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
    },
  });
}

export function useOverrideIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, field, newValue, reason }) =>
      api.post(`/issues/${issueId}/override`, { field, newValue, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['public-issues'] });
      queryClient.invalidateQueries({ queryKey: ['officer-issue-detail', variables.issueId] });
    },
  });
}
