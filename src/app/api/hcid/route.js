// src/app/api/hcid/route.js
import { NextResponse } from "next/server";
import { hcidByCountry as fallbackMap } from "@/data/hcidByCountry";

// GOV.UK content API endpoint for the guidance
const GOVUK_API =
  "https://www.gov.uk/api/content/guidance/high-consequence-infectious-disease-country-specific-risk";

/**
 * Parse the GOV.UK Content API response into a map:
 *   { countryName: [ "HCID A", "HCID B", ... ] }
 *
 * The page body uses "govspeak" rendered into HTML blocks. We look through
 * headings and lists to associate a country with its bullet-listed diseases.
 *
 * This is a best-effort parser; if it fails, we fall back to local mapping.
 */
function parseGovUkToMap(json) {
  const map = {};

  // Defensive: the content lives under details.body, often as an array of
  // govspeak / HTML blocks (schema evolves, so be liberal).
  const bodyBlocks =
    json?.details?.body ??
    json?.details?.parts ??
    json?.details?.document_collections ??
    [];

  // Convert any objects with "content" (HTML) into a single HTML string
  const html = Array.isArray(bodyBlocks)
    ? bodyBlocks
        .map((b) => (typeof b === "string" ? b : b?.content || ""))
        .join("\n")
    : typeof bodyBlocks === "string"
    ? bodyBlocks
    : "";

  if (!html) return null;

  // Very light HTML parsing via regex:
  // 1) Split by <h2> or <h3> sections (countries tend to be section headings).
  // 2) For each section, find the first <ul>…</ul> and read its <li> items as diseases.
  const sections = html
    .split(/<h[23][^>]*>/i)
    .map((chunk) => chunk.split(/<\/h[23]>/i));

  for (const pair of sections) {
    if (!pair || pair.length < 2) continue;
    const [headingRest, remainder] = pair;

    // Extract heading text (strip tags)
    const heading = headingRest
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Heuristic: skip non-country headings (like “Overview”, “How to use”)
    if (!heading || heading.length > 80) continue; // country names are short
    if (/overview|about|how to|contact|references|publication/i.test(heading)) continue;

    // Find first UL after the heading and extract LI texts
    const ulMatch = remainder.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (!ulMatch) continue;

    const items = [];
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    while ((m = liRegex.exec(ulMatch[1])) !== null) {
      const liText = m[1]
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (liText) items.push(liText);
    }

    // Filter bullet items that look like disease names (not explanatory sentences)
    const diseases = items
      .map((t) => t.replace(/\.*$/, ""))
      .filter((t) => t.length <= 80 && /fever|virus|disease|haem|hem|Ebola|Marburg|Lassa|CCHF|Crimean/i.test(t));

    if (diseases.length > 0) {
      map[heading] = diseases;
    } else {
      // If the first UL had no obvious disease names, assume "no listed HCIDs" for this section
      map[heading] = [];
    }
  }

  // If we didn’t find anything meaningful, signal failure
  const foundAny = Object.keys(map).length > 0;
  return foundAny ? map : null;
}

export async function GET() {
  try {
    const res = await fetch(GOVUK_API, {
      // Cache on the server (Vercel) for 24 hours
      next: { revalidate: 60 * 60 * 24 },
      headers: { "User-Agent": "IDNorthwest/1.0 (+https://idnorthwest.co.uk)" },
    });

    if (!res.ok) {
      throw new Error(`GOV.UK fetch failed: ${res.status}`);
    }

    const json = await res.json();
    const parsed = parseGovUkToMap(json);

    // Pull a human "last updated" string if present
    const lastUpdatedText =
      json?.public_updated_at ||
      json?.updated_at ||
      json?.details?.change_history?.[0]?.public_timestamp ||
      null;

    if (parsed) {
      return NextResponse.json({
        source: "govuk",
        fetchedAt: new Date().toISOString(),
        lastUpdatedText,
        map: parsed,
      });
    }

    // Parser didn’t extract; fall back
    return NextResponse.json({
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText: null,
      map: fallbackMap,
    });
  } catch (err) {
    // Network or JSON error — use fallback
    return NextResponse.json({
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText: null,
      map: fallbackMap,
      error: String(err?.message || err),
    });
  }
}
