'use client'
import React from 'react'
import { usePlans } from '../../pricing/hooks/usePricing'
import { useActiveSubscription } from '../hooks/useBilling'
import { useMyTenants } from '../../tenant/hooks/useTenants'
import { PricingCard } from '../../pricing/components/PricingCard'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, Calendar, CheckCircle2, CreditCard, RefreshCw } from 'lucide-react'
const Badge = ({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode
  variant?: string
  className?: string
}) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'default' ? 'bg-primary text-primary-foreground hover:bg-primary/80' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'} ${className}`}
  >
    {children}
  </span>
)
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
)
export const SubscriptionPage: React.FC = () => {
  const { data: tenants, isLoading: isTenantsLoading } = useMyTenants()
  const activeTenant = tenants?.find((t) => t.status === 'active') || tenants?.[0]
  const tenantId = activeTenant?.tenantId || activeTenant?._id
  const { data: plansResponse, isLoading: isPlansLoading } = usePlans()
  const {
    data: subResponse,
    isLoading: isSubLoading,
    isError: isSubError,
  } = useActiveSubscription(tenantId)
  const plans = plansResponse?.data || []
  const activeSub = subResponse?.data
  const currentPlan =
    activeSub?.planId || plans.find((p) => p._id === activeTenant?.planId) || plans[0]
  const isLoading = isTenantsLoading || isPlansLoading || isSubLoading
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString))
  }
  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 col-span-1 md:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  const upgradePlans = plans.filter((p) => {
    if (!currentPlan) return true
    return p.priceMonthly > currentPlan.priceMonthly
  })
  const handleUpgrade = (plan: any) => {
    alert(
      `Upgrading to ${plan.name}... This would normally open the Razorpay checkout flow.`,
    )
    // Future: implement BillingService.createOrder and Razorpay checkout
  }
  return (
    <div className="p-8 space-y-10 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Subscription Management
        </h1>
        <p className="text-muted-foreground">
          Manage your plan, billing, and usage limits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Current Plan Indicator */}
        <Card className="lg:col-span-2 border-2 border-primary/20 shadow-lg bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Current Plan: {currentPlan?.name}
                  <Badge
                    variant="default"
                    className="bg-primary text-primary-foreground animate-pulse"
                  >
                    Active
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1 text-base">
                  {currentPlan?.description}
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold">${currentPlan?.priceMonthly}</span>
                <span className="text-muted-foreground ml-1">/mo</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Features Included:
                </h4>
                <ul className="space-y-2">
                  {currentPlan?.features.slice(0, 4).map((f: any, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Usage Limits:
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Images</span>
                    <span className="font-medium">
                      {currentPlan?.limits.maxImages === -1
                        ? 'Unlimited'
                        : currentPlan?.limits.maxImages}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bandwidth</span>
                    <span className="font-medium">
                      {currentPlan?.limits.maxBandwidthGb} GB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>API Keys</span>
                    <span className="font-medium">{currentPlan?.limits.maxApiKeys}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Active Subscription Panel */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Start Date</span>
                  <span className="text-sm font-medium">
                    {formatDate(activeSub?.startDate)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Next Renewal</span>
                  <span className="text-sm font-medium">
                    {formatDate(activeSub?.endDate)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Payment Method</span>
                  <span className="text-sm font-medium">
                    {activeSub?.razorpayPaymentId
                      ? 'Razorpay (Ending in ****)'
                      : 'Not Set'}
                  </span>
                </div>
              </div>
            </div>

            {isSubError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4" />
                Failed to fetch subscription details.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Upgrade Options Section */}
      {upgradePlans.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight">Upgrade Your Plan</h2>
            <p className="text-muted-foreground">
              Unlock more power and features as you grow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upgradePlans.map((plan) => (
              <PricingCard
                key={plan._id}
                plan={plan}
                isYearly={false}
                billingCycle="monthly"
                isCurrent={false}
                onSelect={handleUpgrade}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
