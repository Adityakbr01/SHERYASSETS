import { animate , motion, useMotionValue, useTransform } from 'framer-motion'
import { noiseUrl } from '../pages/PricingPage'// ── Smooth Price ──────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'import { SlideButton } from '@/components/SlideButton'const SmoothPrice: React.FC<{ price: number; isYearly: boolean }> = ({
  price,
  isYearly,
}) => {
  const count = useMotionValue(price)
  const rounded = useTransform(count, (v) => Math.round(v))
  const [display, setDisplay] = useState(price)
  const prevPrice = useRef(price)  useEffect(() => {
    prevPrice.current = price
    const controls = animate(count, price, { duration: 0.35, ease: 'easeOut' })
    const unsubscribe = rounded.on('change', (v) => setDisplay(v))
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [price])  return (
    <div className="flex items-center h-12 relative overflow-hidden">
      <motion.span
        key={`dollar-${isYearly}`}
        initial={{ y: isYearly ? -20 : 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        $
      </motion.span>
      <motion.span
        key={`num-${isYearly}`}
        initial={{ y: isYearly ? -20 : 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="inline-block tabular-nums"
      >
        {display}
      </motion.span>
    </div>
  )
}// ── Icons ─────────────────────────────────────────────────────────────────────
const CheckCircleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: 'var(--foreground)', flexShrink: 0, marginTop: 2 }}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.5 2.5 5-5.5" />
  </svg>
)const MinusCircleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: 'var(--foreground-subtle)', flexShrink: 0, marginTop: 2 }}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12h8" />
  </svg>
)// ── Types ─────────────────────────────────────────────────────────────────────
interface Feature {
  text: string
  included: boolean
}export interface Plan {
  _id: string
  code: string
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  variant: {
    type: 'gradient' | 'default'
    background: string
  }
  highlightText?: string
  features: Feature[]
}interface PricingCardProps {
  plan: Plan
  isYearly: boolean
  billingCycle: string
  isCurrent?: boolean
  onSelect?: (plan: Plan) => void
}// ── Pricing Card ──────────────────────────────────────────────────────────────
export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  isYearly,
  billingCycle,
  isCurrent,
  onSelect,
}) => {
  const isGradient = plan.variant?.type === 'gradient'
  const currentPrice = isYearly ? plan.priceYearly : plan.priceMonthly
  const buttonLabel = isCurrent
    ? 'Current Plan'
    : currentPrice === 0
      ? 'Get Started'
      : 'Start Free Trial'  return (
    <div
      className={`rounded-4xl p-2.5 w-full relative z-10 font-NeuMachina transition-all duration-300 hover:-translate-y-2 flex flex-col h-full ${isCurrent ? 'ring-2 ring-foreground ring-offset-4 ring-offset-background' : ''}`}
      style={{
        backgroundColor: 'var(--surface-1)',
        boxShadow: isCurrent
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
          : 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-hover)')}
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = isCurrent
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
          : 'var(--shadow-card)')
      }
    >
      {isCurrent && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-20">
          Current Plan
        </div>
      )}
      {/* Top banner */}
      <div
        className="rounded-3xl p-6 pb-7 relative overflow-hidden"
        style={{
          background: isGradient ? plan.variant.background : 'var(--gradient-default)',
        }}
      >
        {isGradient && (
          <div
            className="absolute inset-0 z-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: noiseUrl }}
          />
        )}

        <div className="relative z-10">
          {/* Plan name */}
          <h3
            className="text-base font-semibold tracking-wide mb-3"
            style={{ color: isGradient ? 'rgba(255,255,255,0.95)' : 'var(--foreground)' }}
          >
            {plan.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-3">
            <span
              className="text-[42px] font-bold leading-none tracking-tight flex items-center"
              style={{ color: isGradient ? '#ffffff' : 'var(--foreground)' }}
            >
              <SmoothPrice price={currentPrice} isYearly={isYearly} />
            </span>
            <span
              className="text-[12px] font-medium transition-colors duration-300"
              style={{
                color: isGradient ? 'rgba(255,255,255,0.7)' : 'var(--foreground-muted)',
              }}
            >
              {currentPrice > 0 ? `.99/${billingCycle}` : '/forever'}
            </span>
          </div>

          {/* Description */}
          <p
            className="text-[13px] leading-relaxed mb-6 pr-2 h-10"
            style={{
              color: isGradient ? 'rgba(255,255,255,0.8)' : 'var(--foreground-muted)',
            }}
          >
            {plan.description}
          </p>

          <SlideButton
            isGradient={isGradient}
            label={buttonLabel}
            onClick={() => !isCurrent && onSelect?.(plan)}
          />
        </div>
      </div>

      {/* Features */}
      <div className="px-5 pt-6 pb-6 flex-1 flex flex-col">
        {plan.highlightText && (
          <p
            className="text-[12px] font-semibold mb-4 uppercase tracking-wider"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {plan.highlightText}
          </p>
        )}
        <ul className="flex flex-col gap-3.5">
          {plan.features.map((feature, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-[14px] font-medium"
              style={{
                color: feature.included
                  ? 'var(--foreground)'
                  : 'var(--foreground-subtle)',
              }}
            >
              {feature.included ? <CheckCircleIcon /> : <MinusCircleIcon />}
              <span className="leading-snug pt-px">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
