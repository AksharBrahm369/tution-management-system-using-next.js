import { useQuery } from '@tanstack/react-query';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activeBatches: number;
  todayAttendance: number;
  feeCollected: number;
  pendingFees: number;
  monthlyJoinedStudents: number;
  monthlyCollection: number;
}

export function useAdminStats() {
  return useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}
