import { useCallback, useEffect, useState } from 'react';
import type { IApiKey } from '../api/apiKey.api';
import { apiKeyApi } from '../api/apiKey.api';export function useApiKeys() {
  const [keys, setKeys] = useState<IApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiKeyApi.list();
      if (res.success && Array.isArray(res.data)) {
        setKeys(res.data);
      } else {
        setKeys([]);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to list API keys');
    } finally {
      setLoading(false);
    }
  }, []);  const createKey = async (name: string) => {
    try {
      setError(null);
      const res = await apiKeyApi.create(name);
      if (res.success) {
        // Refetch to invalidate and load real data
        fetchKeys();
        return res.data;
      }
      return null;
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to create API key');
      return null;
    }
  };  const revokeKey = async (keyId: string) => {
    try {
      const res = await apiKeyApi.revoke(keyId);
      if (res.success) {
         setKeys((prev) => 
           prev.map(k => k._id === keyId ? { ...k, status: 'revoked' } : k)
         );
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to revoke API key');
      throw err;
    }
  };  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);  return {
    keys,
    loading,
    error,
    fetchKeys,
    createKey,
    revokeKey
  };
}
