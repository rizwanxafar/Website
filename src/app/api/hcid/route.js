// src/app/api/hcid/route.js
// Static JSON response for HCID snapshot.

export const dynamic = "force-static";   // emit as a static asset, not a serverless function
export const runtime = "nodejs";         // avoid Edge bundling surprises
export const revalidate = 86400;         // 1 day

export async function GET() {
  // Dynamic import prevents bundling issues and keeps build stable
  const { HCID_FALLBACK_MAP, HCID_SNAPSHOT_DATE } = await import("@/data/hcidFallbackSnapshot");

  return Response.json(
    {
      map: HCID_FALLBACK_MAP,
      meta: {
        source: "snapshot-fallback",
        snapshotDate: HCID_SNAPSHOT_DATE,
        note:
          "Cached copy of GOV.UK HCID country-specific risk. For the latest, check GOV.UK.",
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
