"use client";import React from 'react';
import { motion } from 'framer-motion';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, ArrowUpRight, CreditCard, Database, Key, Users } from 'lucide-react';const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};export function DashboardOverview() {
  const { stats, loading } = useDashboardStats();  const mockStats = stats || {
    tenants: 124,
    apiKeys: 420,
    activePlans: 12,
    memberships: 56,
    usageHits: 123049,
  };  const statCards = [
    { title: 'Total Tenants', value: mockStats.tenants, icon: Database, color: 'from-blue-500/20 to-cyan-500/20', textColor: 'text-blue-500', trend: '+12%' },
    { title: 'API Keys', value: mockStats.apiKeys, icon: Key, color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-500', trend: '+5%' },
    { title: 'Active Plans', value: mockStats.activePlans, icon: CreditCard, color: 'from-purple-500/20 to-pink-500/20', textColor: 'text-purple-500', trend: '+2%' },
    { title: 'Members', value: mockStats.memberships, icon: Users, color: 'from-amber-500/20 to-orange-500/20', textColor: 'text-amber-500', trend: '+18%' },
    { title: 'API Usage', value: mockStats.usageHits?.toLocaleString() || '0', icon: Activity, color: 'from-rose-500/20 to-red-500/20', textColor: 'text-rose-500', trend: '+34%' },
  ];  if (loading) {
    return <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">System Overview</h2>
        <p className="text-muted-foreground">Monitor your server's core metrics and health status.</p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        {statCards.map((stat, index) => (
          <motion.div key={index}>
            <Card className="relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-xl hover:shadow-lg transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold tracking-tighter text-foreground">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} ${stat.textColor}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="flex items-center text-emerald-500 font-medium">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    {stat.trend}
                  </span>
                  <span className="ml-2 text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
          className="col-span-4"
        >
          <Card className="h-full border-border/50 bg-background/50 backdrop-blur-xl">
            <CardContent className="p-6 flex flex-col h-full min-h-[300px]">
              <h3 className="text-xl font-semibold mb-4">Traffic Activity</h3>
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/60 rounded-xl bg-muted/20">
                <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-pulse" />
                  Chart visualization component
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
          className="col-span-3"
        >
          <Card className="h-full border-border/50 bg-background/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Server Logs</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((v) => (
                  <div key={v} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 rounded-full ring-4 ring-emerald-500/20 bg-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Auth successful for tenant_{Math.floor(Math.random() * 100)}</p>
                      <p className="text-xs text-muted-foreground">2 mins ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
