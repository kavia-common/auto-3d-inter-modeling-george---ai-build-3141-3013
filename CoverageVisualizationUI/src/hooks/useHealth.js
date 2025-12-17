import { useEffect, useState } from 'react';
import { health } from '../api/client';

// PUBLIC_INTERFACE
export function useHealth(pollMs = 15000) {
  /**
   * Hook to poll backend health endpoint and expose status.
   * Returns: { healthy, lastChecked, error }
   */
  const [healthy, setHealthy] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let timer;

    const check = async () => {
      try {
        const res = await health();
        if (!mounted) return;
        setHealthy(res.ok);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setHealthy(false);
        setError(err.message || 'Health check failed');
      } finally {
        if (mounted) setLastChecked(new Date());
      }
    };

    check();
    if (pollMs > 0) {
      timer = setInterval(check, pollMs);
    }
    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [pollMs]);

  return { healthy, lastChecked, error };
}
