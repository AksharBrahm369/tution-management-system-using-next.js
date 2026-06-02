import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentAdminUser } from '@/lib/adminAuth';
import AdminProviders from './AdminProviders';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect('/auth/login');
  }

  return <AdminProviders user={user}>{children}</AdminProviders>;
}
