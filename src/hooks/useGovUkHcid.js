import { useState, useEffect, useMemo } from 'react';
import { HCID_FALLBACK_MAP } from '@/data/hcidFallbackSnapshot';

// Strict normalization to match the form input
function normalize(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, " ")             // Collapse spaces
    .trim();
}

export default function useGovUkHcid() {
  const [data, setData] = useState(HCID_FALLBACK_MAP);
  const [meta, setMeta] = useState({ source: 'fallback', snapshotDate: 'Initial' });

  useEffect(() => {
    async function loadData() {
      try {
        // Attempt to fetch from our Daily Scraper API
        const res = await fetch('/api/hcid'); 
        if (!res.ok) throw new Error("API failed");
        
        const json = await res.json();
        
        // Only update if we actually got data back
        if (json.data && Object.keys(json.data).length > 0) {
          setData(json.data);
          setMeta({ 
            source: json.source, 
            snapshotDate: json.date 
          });
        }
      } catch (err) {
        // Silently fail to fallback (already loaded)
        console.warn("Using local HCID snapshot");
      }
    }

    loadData();
  }, []);

  // Generate the lookup map (Memoized for performance)
  const normalizedMap = useMemo(() => {
    const map = new Map();
    // Ensure data is valid before iterating
    const sourceData = data || HCID_FALLBACK_MAP; 
    
    Object.entries(sourceData).forEach(([country, entries]) => {
      map.set(normalize(country), entries);
    });
    return map;
  }, [data]);

  return { normalizedMap, meta, refresh: () => {} };
}
