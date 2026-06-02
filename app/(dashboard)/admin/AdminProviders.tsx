'use client';

import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayoutComponent from '@/components/admin/layout/AdminLayout';
import type { CurrentAdminUser } from '@/lib/adminAuth';

interface AdminProvidersProps {
  children: React.ReactNode;
  user: CurrentAdminUser;
}

export default function AdminProviders({ children, user }: AdminProvidersProps) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayoutComponent user={user}>{children}</AdminLayoutComponent>
    </QueryClientProvider>
  );
}
