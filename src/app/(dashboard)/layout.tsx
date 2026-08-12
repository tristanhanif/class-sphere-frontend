'use client';

import { DashboardLayout } from '@/components/layouts/dashboard-layout';

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
