import React from 'react';
import { DashboardOverview } from '@/src/features/dashboard/components/dashboard-overview';export const metadata = {
  title: 'Dashboard | Nexus Server Admin',
  description: 'Manage your server infrastructure.',
};export default function DashboardPage() {
  return <DashboardOverview />;
}
