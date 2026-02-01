// src/hooks/useGovUkHcid.js
import { useState, useEffect } from 'react';
import { HCID_FALLBACK_MAP } from '@/data/hcidFallbackSnapshot';
import { normalizeName } from '@/utils/names';

export default function useGovUkHcid() {
  const [data, setData] = useState(HCID_FALLBACK_MAP);
  const [meta, setMeta] = useState({ source: 'fallback', snapshotDate: 'Initial' });

  useEffect(() => {
    async function loadData() {
      try {
        // fetch our own API route
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
        // data is already set to fallback initial state
      }
    }

    loadData();
  }, []);

  // Compute the normalized map for lookups
  const normalizedMap = new Map();
  Object.entries(data).forEach(([country, entries]) => {
    normalizedMap.set(normalizeName(country), entries);
  });

  return {
    raw: data,
    normalizedMap,
    meta,
    refresh: () => { /* Optional manual re-fetch logic */ }
  };
}
