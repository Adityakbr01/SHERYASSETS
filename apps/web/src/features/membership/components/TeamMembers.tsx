'use client'
import React from 'react'
import { Crown, Plus, Shield, Trash2, User } from 'lucide-react'
import { useTenantMembers } from '../hooks/useMemberships'
export function TeamMembers({ isContextReady }: { isContextReady: boolean }) {
  const { data: members, isLoading, isError } = useTenantMembers(isContextReady)
  if (isLoading || !isContextReady) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 h-64 animate-pulse flex flex-col gap-4">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-full w-full bg-muted rounded-xl" />
      </div>
    )
  }
  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-2xl text-center">
        Failed to load team members.
      </div>
    )
  }
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-amber-500" />
      case 'admin':
        return <Shield className="w-4 h-4 text-emerald-500" />
      default:
        return <User className="w-4 h-4 text-zinc-400" />
    }
  }
  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-card-foreground">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">Team Members</h3>
          <p className="text-sm text-muted-foreground">Manage who has access to this organization.</p>
        </div>
        <button className="flex apple-border-shine items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-full text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {members?.map((member: any) => (
          <div
            key={member._id}
            className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-500 font-bold uppercase ring-1 ring-border">
                {member.userId?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-foreground">{member.userId?.name || 'Unknown User'}</p>
                <p className="text-sm text-muted-foreground">{member.userId?.email || 'No email'}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full border border-border">
                {getRoleIcon(member.role)}
                <span className="text-sm font-medium text-black dark:text-white capitalize">{member.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${member.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  } capitalize`}>
                  {member.status}
                </span>
                {member.role !== 'owner' && (
                  <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {(!members || members.length === 0) && (
          <div className="text-center py-8 text-zinc-500">
            No team members found.
          </div>
        )}
      </div>
    </div>
  )
}
