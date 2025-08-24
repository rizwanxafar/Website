// src/hooks/useGovUkHcid.js
// Fetches /api/hcid and builds a normalised lookup map.
// Use: const { map, meta, normalizedMap, refresh, loading, error } = useGovUkHcid();

import { useEffect, useMemo, useState } from "react";
import { buildNormalizedMap } from "@/utils/names";

export default function useGovUkHcid() {
  const [map, setMap] = useState(null); // raw object { Country: [entries] }
  const [meta, setMeta] = useState({ source: "fallback", lastUpdatedText: null, snapshotDate: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/hcid", { cache: "no-cache" });
      const data = await res.json();
      setMap(data?.map ?? {});
      setMeta({
        source: data?.source || "fallback",
        lastUpdatedText: data?.lastUpdatedText || null,
        snapshotDate: data?.snapshotDate || null,
      });
    } catch (e) {
      setMap({});
      setMeta({ source: "fallback", lastUpdatedText: null, snapshotDate: null });
      setError("Failed to fetch GOV.UK data; using local snapshot if available.");
    } finally {
      setLoading(false);
    }
  };

  // Consumers can call refresh() exactly when they want (e.g., on entering Review step)
  const normalizedMap = useMemo(() => buildNormalizedMap(map || {}), [map]);

  return { map, meta, normalizedMap, refresh, loading, error };
}
