// src/hooks/useGovUkHcid.js
// Snapshot-only mode: always loads HCID_FALLBACK_MAP from local snapshot.
// Safer for Vercel CPU limits. If you want to re-enable live fetch later,
// see the commented section below.

import { useMemo, useState } from "react";
import { buildNormalizedMap } from "@/utils/names";
import {
  HCID_FALLBACK_MAP,
  HCID_SNAPSHOT_DATE,
} from "@/data/hcidFallbackSnapshot";

export default function useGovUkHcid() {
  // In snapshot-only mode, map never changes
  const [map] = useState(HCID_FALLBACK_MAP);
  const [meta] = useState({
    source: "fallback",
    snapshotDate: HCID_SNAPSHOT_DATE,
    lastUpdatedText: `Snapshot captured ${HCID_SNAPSHOT_DATE}`,
  });

  // No network, so no loading/error state
  const loading = false;
  const error = "";

  // Refresh does nothing in snapshot-only mode
  const refresh = async () => {
    console.warn("Refresh called: snapshot-only mode (no live fetch).");
  };

  const normalizedMap = useMemo(() => buildNormalizedMap(map || {}), [map]);

  return { map, meta, normalizedMap, refresh, loading, error };
}

/*
---------------------------------------------
TO RE-ENABLE LIVE FETCH LATER:
---------------------------------------------
1. Restore useEffect + fetch from your old version.
2. When fetch fails, fall back to HCID_FALLBACK_MAP.
3. Keep meta.source = "live" when fetch succeeds, else "fallback".
---------------------------------------------
*/
