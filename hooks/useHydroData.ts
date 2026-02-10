
import { useState, useCallback, useEffect } from 'react';
import { User, HydroPoco, HydroCisterna, HydroCaixa, HydroSettings } from '../types';
import { hydroService } from '../services/hydroService';
import { logger } from '../utils/logger';

interface UseHydroDataResult {
  pocos: HydroPoco[];
  cisternas: HydroCisterna[];
  caixas: HydroCaixa[];
  settings: HydroSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useHydroData = (user: User): UseHydroDataResult => {
  const [pocos, setPocos] = useState<HydroPoco[]>([]);
  const [cisternas, setCisternas] = useState<HydroCisterna[]>([]);
  const [caixas, setCaixas] = useState<HydroCaixa[]>([]);
  const [settings, setSettings] = useState<HydroSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, k, s] = await Promise.all([
        hydroService.getPocos(user),
        hydroService.getCisternas(user),
        hydroService.getCaixas(user),
        hydroService.getSettings()
      ]);
      
      // Check if component is still mounted logic is handled by useEffect cleanup usually,
      // but for async updates inside a callback, strictly speaking we rely on React state 
      // not throwing errors in modern versions, or a ref check.
      // Given the simple architecture, we just set state.
      
      setPocos(p);
      setCisternas(c);
      setCaixas(k);
      setSettings(s);
    } catch (error) {
      logger.error("Error fetching hydro data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
        setLoading(true);
        try {
            const [p, c, k, s] = await Promise.all([
                hydroService.getPocos(user),
                hydroService.getCisternas(user),
                hydroService.getCaixas(user),
                hydroService.getSettings()
            ]);
            
            if (mounted) {
                setPocos(p);
                setCisternas(c);
                setCaixas(k);
                setSettings(s);
            }
        } catch (e) {
            logger.error(e);
        } finally {
            if (mounted) setLoading(false);
        }
    };

    init();

    return () => {
        mounted = false;
    };
  }, [user]);

  return { pocos, cisternas, caixas, settings, loading, refresh };
};
