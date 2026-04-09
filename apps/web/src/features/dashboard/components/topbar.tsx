"use client"import React from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';export function Topbar() {
  const user = useAuthStore((state) => state.user);  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-background/50 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-xl font-semibold tracking-tight hidden md:block text-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>

        <div className="relative max-w-sm w-full ml-auto md:ml-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search API keys, tenants..."
            className="w-full bg-muted/40 border-none rounded-full pl-9 focus-visible:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted/80">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border border-background"></span>
        </Button>
        <ThemeToggle />
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 shadow-sm border-2 border-background cursor-pointer hover:scale-105 transition-transform" />
      </div>
    </header>
  );
}
