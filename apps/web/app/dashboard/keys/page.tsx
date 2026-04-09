import React from 'react';
import { ApiKeyList } from '@/src/features/apiKey/components/ApiKeyList';export const metadata = {
  title: 'API Keys | Nexus Dashboard',
  description: 'Manage programmatic API keys for your infrastructure.',
};export default function ApiKeysPage() {
  return (
    <div className="w-full max-w-7xl mx-auto py-4">
      <ApiKeyList />
    </div>
  );
}
