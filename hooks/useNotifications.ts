import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'STUDENT_ENROLLED' | 'FEE_RECEIVED' | 'LOW_ATTENDANCE' | 'NEW_ENQUIRY' | 'EXAM_RESULT' | 'ANNOUNCEMENT' | 'GENERAL';
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 1 * 60 * 1000, // Refresh every minute
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch('/api/admin/notifications/mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/notifications/mark-all-read', {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
