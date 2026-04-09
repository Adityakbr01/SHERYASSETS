import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'API Keys | Nexus Dashboard',
  description: 'Manage programmatic API keys for your infrastructure.',
}
export default function KeysLayout({ children }: { children: React.ReactNode }) {
  return children
}
