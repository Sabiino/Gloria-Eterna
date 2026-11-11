import { getUniformLayers } from '@/services/uniform/uniform-service';
import type { UniformLayer } from '@/types/uniform';
import { useEffect, useState } from 'react';

/** Read-only public configuration used wherever Miguel is rendered for players. */
export function useOfficialUniform() {
  const [layers, setLayers] = useState<UniformLayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getUniformLayers().then((next) => active && setLayers(next)).catch(() => {
      // The base model remains usable when offline or before Firebase is configured.
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return { layers, loading };
}
