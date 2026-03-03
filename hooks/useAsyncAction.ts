import { useCallback, useMemo, useState } from 'react';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export const useAsyncAction = () => {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(async <T,>(action: () => Promise<T>) => {
    setStatus('loading');
    setError(null);
    try {
      const result = await action();
      setStatus('success');
      return result;
    } catch (err) {
      setStatus('error');
      setError(err);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  const isLoading = useMemo(() => status === 'loading', [status]);

  return {
    status,
    error,
    isLoading,
    run,
    reset,
  };
};
