'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayoutComponent from '@/components/admin/layout/AdminLayout';

const queryClient = new QueryClient();

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayoutComponent>{children}</AdminLayoutComponent>
    </QueryClientProvider>
  );
};

export default AdminLayout;
