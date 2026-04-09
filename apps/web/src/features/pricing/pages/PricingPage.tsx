'use client'import React, { useState } from 'react'
import { PricingCard } from '../components/PricingCard'
import { PremiumToggle } from '../components/Premiumtoggle'
import { usePlans } from '../hooks/usePricing'
import { useCurrentUser } from '../../auth/hooks/useCurrentUser'
import { useMyTenants } from '../../tenant/hooks/useTenants'export const noiseUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`const PricingPage: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false)
  const {
    data: plansResponse,
    isLoading: isPlansLoading,
    isError: isPlansError,
  } = usePlans()
  const { user } = useCurrentUser()
  const { data: tenants } = useMyTenants()  // Determine current plan if user is logged in
  // For simplicity, we'll use the first tenant's plan or the one with active status
  const activeTenant = tenants?.find((t) => t.status === 'active') || tenants?.[0]
  const currentPlanId = activeTenant?.planId  if (isPlansLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    )
  }  if (isPlansError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold mb-4">Failed to load pricing plans</h2>
        <p className="text-foreground-muted mb-6">Please try again later.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-foreground text-background rounded-full font-bold"
        >
          Retry
        </button>
      </div>
    )
  }  const plans = plansResponse?.data || []  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20 md:py-0 overflow-hidden">
      <div
        className="absolute inset-0 z-0 opacity-[0.35] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: noiseUrl }}
      />

      {/* "PRICING" — top */}
      <div className="absolute top-2 left-0 right-0 flex items-start justify-center pointer-events-none select-none overflow-hidden">
        <span
          className="font-black tracking-tighter leading-none whitespace-nowrap"
          style={{
            fontSize: 'clamp(80px, 18vw, 260px)',
            color: 'var(--foreground)',
            opacity: 0.065,
            lineHeight: 0.85,
            marginTop: '-0.05em',
          }}
        >
          PRICING
        </span>
      </div>

      {/* "THAT MATTERS" — bottom */}
      <div className="absolute bottom-1 left-0 right-0 flex items-end justify-center pointer-events-none select-none overflow-hidden">
        <span
          className="font-black tracking-tighter leading-none whitespace-nowrap"
          style={{
            fontSize: 'clamp(48px, 16vw, 160px)',
            color: 'var(--foreground)',
            opacity: 0.075,
            lineHeight: 0.85,
            marginBottom: '-0.05em',
          }}
        >
          THAT MATTERS
        </span>
      </div>

      {/* Top fade — uses CSS var so it adapts to light/dark */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none z-10"
        style={{
          background:
            'linear-gradient(to bottom, var(--background) 0%, transparent 100%)',
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to top, var(--background) 0%, transparent 100%)',
        }}
      />

      {/* Toggle */}
      <div className="relative z-20 mb-10">
        <PremiumToggle isYearly={isYearly} setIsYearly={setIsYearly} />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl relative z-20 place-items-center">
        {plans.map((plan, index) => (
          <div
            key={plan._id}
            className={`w-full flex justify-center ${
              plans.length === 4 && index === plans.length - 1
                ? 'sm:col-span-2 lg:col-span-1 lg:col-start-2'
                : ''
            }`}
          >
            <PricingCard
                            plan={plan}
                            isYearly={isYearly}
                            billingCycle={isYearly ? 'yearly' : 'monthly'}
                            isCurrent={currentPlanId === plan._id}
                            onSelect={(selectedPlan) => {
                                console.log('Selected plan:', selectedPlan);
                                // Future: Open checkout or upgrade flow
                            }}
                        />
          </div>
        ))}
      </div>
    </div>
  )
}export default PricingPage
