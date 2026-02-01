import { useState, useEffect, useMemo } from 'react';
import { HCID_FALLBACK_MAP } from '@/data/hcidFallbackSnapshot';
import { buildNormalizedMap } from '@/utils/names';

export default function useGovUkHcid() {
  // Default to the snapshot immediately so the UI never flickers "empty"
  const [data, setData] = useState(HCID_FALLBACK_MAP);
  const [meta, setMeta] = useState({ source: 'fallback', snapshotDate: 'Initial' });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/hcid'); 
        if (!res.ok) throw new Error("API failed");
        
        const json = await res.json();
        const incomingData = json.data || {};

        // --- VIBE CHECK: DATA INTEGRITY ---
        // A bad scrape might return countries with empty arrays. 
        // We calculate the total number of disease entries across all countries.
        // If it's effectively zero, the scrape failed (even if the API returned 200 OK).
        const totalEntries = Object.values(incomingData).reduce((acc, arr) => {
          return acc + (Array.isArray(arr) ? arr.length : 0);
        }, 0);

        // Only accept the data if we actually found diseases (e.g., >10 is a safe sanity floor)
        if (totalEntries > 10) {
          setData(incomingData);
          setMeta({ 
            source: json.source || 'gov.uk', 
            snapshotDate: json.date || new Date().toISOString()
          });
        } else {
          console.warn(`Live data rejected: Found ${Object.keys(incomingData).length} countries but only ${totalEntries} diseases. Keeping fallback.`);
        }

      } catch (err) {
        console.warn("Using local HCID snapshot (Network error or Integrity Check failed)", err);
      }
    }

    loadData();
  }, []);

  // STRICT: Single Source of Truth for map generation
  const normalizedMap = useMemo(() => {
    return buildNormalizedMap(data);
  }, [data]);

  return { normalizedMap, meta, refresh: () => {} };
}
