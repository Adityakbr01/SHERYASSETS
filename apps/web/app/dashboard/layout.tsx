import React from 'react';
import { DashboardLayout } from '@/src/features/dashboard/components/dashboard-layout';export default function AppDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
