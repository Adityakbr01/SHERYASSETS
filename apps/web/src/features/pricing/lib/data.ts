export interface Plan {
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  variant: {
    type: 'gradient' | 'default'
    background: string
  }
  highlightText?: string
  features: Feature[]
}interface Feature {
  text: string
  included: boolean
}export const plans: Plan[] = [
  {
    name: 'Free',
    description: 'Perfect for individuals just getting started with basic needs.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    variant: {
      type: 'default',
      background: 'linear-gradient(160deg, #ececec 0%, #e0e0e0 100%)',
    },
    highlightText: 'Minimum Requirements:',
    features: [
      { text: '1 workspace user', included: true },
      { text: '100 gross Objects', included: true },
      { text: '10GB Storage space', included: true },
      { text: 'Video / Audio Traffic', included: false },
      { text: 'Advanced AI Access', included: false },
    ],
  },
  {
    name: 'Starter',
    description: 'Great for small teams needing more storage and traffic.',
    monthlyPrice: 49,
    yearlyPrice: 490,
    variant: {
      type: 'gradient',
      // Burnt brown → terracotta → warm amber
      background:
        'linear-gradient(145deg, #2d1b00 0%, #7d594b 30%, #ca855b 65%, #f4a261 100%)',
    },
    highlightText: 'Everything in Free, plus:',
    features: [
      { text: 'Up to 5 users', included: true },
      { text: '10,000 gross Objects', included: true },
      { text: '1TB Storage space', included: true },
      { text: '100GB Video / Audio Traffic', included: true },
      { text: 'Advanced AI Access', included: false },
    ],
  },
  {
    name: 'Pro',
    description: 'For teams scaling fast with advanced workflows and integrations.',
    monthlyPrice: 149,
    yearlyPrice: 1490,
    variant: {
      type: 'gradient',
      // Deep ocean → teal → emerald
      background:
        'linear-gradient(145deg, #0d1b2a 0%, #1b4332 30%, #2d6a4f 60%, #52b788 100%)',
    },
    highlightText: 'Everything in Starter, plus:',
    features: [
      { text: 'Up to 25 users', included: true },
      { text: '100,000 gross Objects', included: true },
      { text: '5TB Storage space', included: true },
      { text: '500GB Video / Audio Traffic', included: true },
      { text: 'Advanced AI Access', included: true },
    ],
  },
]
