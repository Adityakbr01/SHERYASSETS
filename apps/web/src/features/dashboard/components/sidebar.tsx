'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import {
  Building,
  ChevronLeft,
  ChevronRight,
  Key,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import { useDashboardStore } from '../store/useDashboardStore'
import { useAuthStore } from '../../auth/hooks/useAuthStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Api Keys', href: '/dashboard/keys', icon: Key },
  { name: "tenants", href: "/dashboard/tenants", icon: Building }
]
export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { sidebarOpen, toggleSidebar } = useDashboardStore()
  const zustandLogout = useAuthStore((state) => state.logout)
  const handleLogout = () => {
    zustandLogout()
    queryClient.clear()
    router.push('/login')
  }
  return (
    <motion.aside
      className="relative flex flex-col h-screen bg-background/50 backdrop-blur-xl border-r border-border drop-shadow-sm sticky top-0 z-40 transition-all duration-300"
      initial={{ width: 240 }}
      animate={{ width: sidebarOpen ? 240 : 80 }}
    >
      <div
        className={cn(
          'flex items-center p-4 mb-4',
          sidebarOpen ? 'justify-between' : 'justify-center',
        )}
      >
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary overflow-hidden whitespace-nowrap"
            >
              <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md"></div>
              <span>Nexus</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-full hover:bg-muted flex-shrink-0"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} className="block w-full">
              <motion.div
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex w-full  items-center px-3 py-2.5 rounded-full transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  !sidebarOpen && 'justify-center',
                )}
              >
                <item.icon
                  className={cn('w-5 h-5 shrink-0', isActive ? 'text-primary' : '')}
                />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border bg-background/30 backdrop-blur-lg">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center px-3 py-2.5 text-rose-500 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer',
            !sidebarOpen && 'justify-center',
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="ml-3 whitespace-nowrap font-medium overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.aside>
  )
}
