import { useState, useCallback } from 'preact/hooks';
import { get, post, put } from '../api.js';

/**
 * Hook for API calls with loading/error state.
 * Returns { data, loading, error, refetch }
 */
export function useApi(path, { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const refetch = useCallback(async (overridePath) => {
    setLoading(true);
    setError(null);
    try {
      const result = await get(overridePath || path);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [path]);

  return { data, loading, error, refetch, setData };
}

export { get, post, put };
