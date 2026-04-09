import { create } from 'zustand';
import { persist } from 'zustand/middleware';interface DashboardState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'dashboard-storage',
    }
  )
);
