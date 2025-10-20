// src/app/api/hcid/route.js
// Serve the frozen HCID snapshot only (no live fetch).
// Keeps Vercel CPU usage near zero.

import { NextResponse } from "next/server";
import {
  HCID_FALLBACK_MAP,
  HCID_SNAPSHOT_DATE,
} from "@/data/hcidFallbackSnapshot";

export async function GET() {
  return NextResponse.json(
    {
      map: HCID_FALLBACK_MAP,
      meta: {
        source: "snapshot-fallback",
        snapshotDate: HCID_SNAPSHOT_DATE,
        note:
          "This is a cached copy of GOV.UK HCID country-specific risk data. " +
          "For the most recent updates, always check the GOV.UK official site.",
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800", // 1 day cache, 7 days stale
      },
    }
  );
}
