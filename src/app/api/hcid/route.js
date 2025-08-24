// src/app/api/hcid/route.js
import { NextResponse } from "next/server";

const GOVUK_API =
  "https://www.gov.uk/api/content/guidance/high-consequence-infectious-disease-country-specific-risk";

/**
 * Best-effort parser:
 * Turn GOV.UK Content API HTML body into { country: [ "HCID A", "HCID B", ... ] }.
 * If structure changes or we can’t parse, we return null (caller should fall back).
 */
function parseGovUkToMap(json) {
  const bodyBlocks = json?.details?.body ?? [];
  const html = Array.isArray(bodyBlocks)
    ? bodyBlocks.map(b => (typeof b === "string" ? b : b?.content || "")).join("\n")
    : typeof bodyBlocks === "string"
      ? bodyBlocks
      : "";

  if (!html) return null;

  const sections = html
    .split(/<h[23][^>]*>/i)
    .map(chunk => chunk.split(/<\/h[23]>/i));

  const map = {};
  for (const pair of sections) {
    if (!pair || pair.length < 2) continue;
    const [headingRest, remainder] = pair;

    const heading = headingRest.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!heading || heading.length > 80) continue;
    if (/overview|about|how to|contact|references|publication/i.test(heading)) continue;

    const ulMatch = remainder.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (!ulMatch) continue;

    const items = [];
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    while ((m = liRegex.exec(ulMatch[1])) !== null) {
      const liText = m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      if (liText) items.push(liText);
    }

    const diseases = items
      .map(t => t.replace(/\.*$/, ""))
      .filter(t => t.length <= 80 && /fever|virus|disease|haem|hem|Ebola|Marburg|Lassa|CCHF|Crimean/i.test(t));

    map[heading] = diseases; // empty array = “no listed HCID”
  }

  return Object.keys(map).length ? map : null;
}

export async function GET() {
  try {
    const res = await fetch(GOVUK_API, {
      next: { revalidate: 60 * 60 * 24 }, // cache for 24h on Vercel
      headers: { "User-Agent": "IDNorthwest/1.0 (+https://idnorthwest.co.uk)" },
    });
    if (!res.ok) throw new Error(`GOV.UK fetch failed: ${res.status}`);

    const json = await res.json();
    const parsed = parseGovUkToMap(json);

    const lastUpdatedText =
      json?.public_updated_at ||
      json?.updated_at ||
      json?.details?.change_history?.[0]?.public_timestamp ||
      null;

    return NextResponse.json({
      source: parsed ? "govuk" : "fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText,
      map: parsed || {}, // empty map signals “no HCIDs known via parser”
    });
  } catch (err) {
    return NextResponse.json({
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText: null,
      map: {},
      error: String(err?.message || err),
    });
  }
}
