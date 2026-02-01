import { useState, useEffect, useMemo } from 'react';
import { HCID_FALLBACK_MAP } from '@/data/hcidFallbackSnapshot';
import { buildNormalizedMap } from '@/utils/names';

export default function useGovUkHcid() {
  const [data, setData] = useState(HCID_FALLBACK_MAP);
  const [meta, setMeta] = useState({ source: 'fallback', snapshotDate: 'Initial' });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/hcid'); 
        if (!res.ok) throw new Error("API failed");
        
        const json = await res.json();
        
        if (json.data && Object.keys(json.data).length > 0) {
          setData(json.data);
          setMeta({ 
            source: json.source, 
            snapshotDate: json.date 
          });
        }
      } catch (err) {
        console.warn("Using local HCID snapshot (Network/API error)");
      }
    }

    loadData();
  }, []);

  // STRICT: Only use the shared helper to build the map
  const normalizedMap = useMemo(() => {
    return buildNormalizedMap(data);
  }, [data]);

  return { normalizedMap, meta, refresh: () => {} };
}
