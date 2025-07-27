import axios from 'axios';
import { useCallback } from 'react';
import useSWR, { mutate } from 'swr';

export interface CustomDeclineReason {
  id: number;
  reason: string;
  createdAt: string;
}

export const useDeclineReasons = () => {
  const { data: customReasons, error } = useSWR<CustomDeclineReason[]>(
    '/api/v1/settings/decline-reasons'
  );

  const addCustomReason = useCallback(async (reason: string) => {
    await axios.post('/api/v1/settings/decline-reasons', { reason });
    mutate('/api/v1/settings/decline-reasons');
  }, []);

  const removeCustomReason = useCallback(async (id: number) => {
    await axios.delete(`/api/v1/settings/decline-reasons/${id}`);
    mutate('/api/v1/settings/decline-reasons');
  }, []);

  return {
    customReasons: customReasons || [],
    isLoading: !customReasons && !error,
    error,
    addCustomReason,
    removeCustomReason,
  };
};
