// src/app/api/hcid/route.js
import { NextResponse } from "next/server";

const GOVUK_API =
  "https://www.gov.uk/api/content/guidance/high-consequence-infectious-disease-country-specific-risk";

// Minimal seed fallback to avoid false reassurance if the parser fails.
// Expand this as needed if GOV.UK changes structure radically.
const SEED_HCID_MAP = {
  "Congo (Democratic Republic)": ["Ebola virus disease"],
  "Democratic Republic of the Congo": ["Ebola virus disease"],
  "Uganda": ["Marburg virus disease"],
  "Nigeria": ["Lassa fever"],
  "Ghana": ["Marburg virus disease"],
  "Guinea": ["Ebola virus disease"],
  "Sierra Leone": ["Lassa fever", "Ebola virus disease"],
  "Liberia": ["Ebola virus disease", "Lassa fever"],
  "Sudan": ["Ebola virus disease (Sudan virus)"],
  "South Sudan": ["Ebola virus disease"],
  "Afghanistan": ["Crimean-Congo haemorrhagic fever"],
  "Pakistan": ["Crimean-Congo haemorrhagic fever"],
  "Türkiye": ["Crimean-Congo haemorrhagic fever"],
  "Turkey": ["Crimean-Congo haemorrhagic fever"],
  "Iran": ["Crimean-Congo haemorrhagic fever"],
  "Iraq": ["Crimean-Congo haemorrhagic fever"],
};

function stripTags(s = "") {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Try to extract country sections and li items from different govspeak layouts
function parseGovUkToMap(json) {
  // 1) details.body can be an array of blocks or a string
  const blocks = json?.details?.body;
  const html =
    Array.isArray(blocks)
      ? blocks.map(b => (typeof b === "string" ? b : b?.content || "")).join("\n")
      : typeof blocks === "string"
        ? blocks
        : "";

  if (!html) return null;

  const map = {};

  // Approach A: Split by headings (h2/h3) into sections; grab the first UL
  const sections = html.split(/<h[23][^>]*>/i).map(chunk => chunk.split(/<\/h[23]>/i));
  for (const pair of sections) {
    if (!pair || pair.length < 2) continue;
    const [headingRaw, remainder] = pair;
    const heading = stripTags(headingRaw);
    if (!heading || heading.length > 80) continue;
    if (/overview|about|how to|contact|references|publication/i.test(heading)) continue;

    // Many country sections use a UL of diseases
    const ulMatch = remainder.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (ulMatch) {
      const items = [];
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let m;
      while ((m = liRegex.exec(ulMatch[1])) !== null) {
        const liText = stripTags(m[1]);
        if (liText) items.push(liText);
      }
      // Filter items that look like disease names (short, disease-ish)
      const diseases = items
        .map(t => t.replace(/\.*$/, ""))
        .filter(t => t.length <= 80 && /fever|virus|disease|Ebola|Marburg|Lassa|CCHF|Crimean/i.test(t));
      map[heading] = diseases; // empty array is valid = "no listed HCIDs"
      continue;
    }

    // Approach B: Some sections use paragraphs with disease names — capture short lines
    const pMatches = [...remainder.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => stripTags(m[1]));
    const pDiseases = pMatches.filter(
      t => t && t.length <= 80 && /fever|virus|disease|Ebola|Marburg|Lassa|CCHF|Crimean/i.test(t)
    );
    if (pDiseases.length) {
      map[heading] = pDiseases;
    } else {
      // Record the section with empty list to indicate "no listed HCIDs"
      map[heading] = [];
    }
  }

  return Object.keys(map).length ? map : null;
}

export async function GET() {
  try {
    const res = await fetch(GOVUK_API, {
      next: { revalidate: 60 * 60 * 24 }, // 24h cache on Vercel
      headers: { "User-Agent": "IDNorthwest/1.0 (+https://idnorthwest.co.uk)" },
    });
    if (!res.ok) throw new Error(`GOV.UK fetch failed: ${res.status}`);

    const json = await res.json();
    const parsed = parseGovUkToMap(json);

    // Prefer GOV.UK parse; otherwise use seed fallback
    const effectiveMap = parsed && Object.keys(parsed).length ? parsed : SEED_HCID_MAP;

    const lastUpdatedText =
      json?.public_updated_at ||
      json?.updated_at ||
      json?.details?.change_history?.[0]?.public_timestamp ||
      null;

    return NextResponse.json({
      source: parsed ? "govuk" : "seed-fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText,
      map: effectiveMap,
    });
  } catch (err) {
    // If the network fails, ship the seed fallback
    return NextResponse.json({
      source: "seed-fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText: null,
      map: SEED_HCID_MAP,
      error: String(err?.message || err),
    });
  }
}
