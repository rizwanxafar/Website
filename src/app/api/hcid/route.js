// src/app/api/hcid/route.js
import { NextResponse } from "next/server";

const GOVUK_API =
  "https://www.gov.uk/api/content/guidance/high-consequence-infectious-disease-country-specific-risk";

// Minimal seed fallback so we never give false reassurance if parsing fails.
// You can expand this over time.
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

// Extract inner HTML safely from govspeak blocks
function bodyHtmlFromGovUk(json) {
  const blocks = json?.details?.body;
  if (Array.isArray(blocks)) {
    return blocks.map((b) => (typeof b === "string" ? b : b?.content || "")).join("\n");
  }
  if (typeof blocks === "string") return blocks;
  return "";
}

/**
 * Parse the GOV.UK govspeak-rendered HTML where countries are listed inside tables.
 * We scan all <table> elements and read rows as:
 *   col0 = country/territory name
 *   col1 = HCID disease (may be link text)
 * If col1 indicates 'None'/'No known', we record an empty array for that country.
 * Returns: { [countryName]: [disease, ...] } (disease array may be empty)
 */
function parseTablesToMap(html) {
  if (!html) return null;

  const map = {};
  // Grab all tables
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  const tables = html.match(tableRegex) || [];

  for (const table of tables) {
    // Grab rows (skip header if present)
    const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
    const rows = table.match(rowRegex) || [];

    for (const row of rows) {
      // Extract cells
      const cellRegex = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
      const cells = [];
      let m;
      while ((m = cellRegex.exec(row)) !== null) {
        // Keep both raw and text for the first two cols (country, disease)
        const raw = m[2] || "";
        const text = stripTags(raw);
        cells.push({ raw, text });
      }
      if (cells.length < 2) continue;

      const country = cells[0].text;
      const diseaseCellText = cells[1].text;

      if (!country) continue;

      // Some rows are headers or grouping rows — skip if country looks like a section label
      if (/countries\s+[a-z]\s+to\s+[a-z]/i.test(country)) continue; // “Countries A to D”
      if (/^country|territory$/i.test(country)) continue; // header cell

      // Determine diseases for this row
      let diseases = [];
      const rawDisease = diseaseCellText.trim();

      if (!rawDisease || /^none\b|^no known\b/i.test(rawDisease)) {
        diseases = [];
      } else {
        // Prefer anchor/link text if present (e.g., <a>Marburg virus disease</a>)
        const linkTextMatches = [...(cells[1].raw.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi))].map(
          (mm) => stripTags(mm[1] || "")
        ).filter(Boolean);

        if (linkTextMatches.length > 0) {
          diseases = linkTextMatches;
        } else {
          // Otherwise, use the plain text; split on common separators if multiple listed
          // e.g., "Lassa fever; Ebola virus disease"
          const split = rawDisease.split(/;|,|\/|\band\b/gi).map((s) => s.trim()).filter(Boolean);
          diseases = split.length ? split : [rawDisease];
        }
      }

      // Merge into map (some countries may appear multiple times across sections)
      if (!Object.prototype.hasOwnProperty.call(map, country)) {
        map[country] = [];
      }
      for (const d of diseases) {
        if (d && !map[country].includes(d)) map[country].push(d);
      }
      // If no diseases, ensure at least an empty array is recorded (meaning “explicit none”)
      if (diseases.length === 0 && !map[country]) map[country] = [];
    }
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
    const html = bodyHtmlFromGovUk(json);
    const parsed = parseTablesToMap(html);

    // Choose parsed map if available, otherwise seed fallback
    const effectiveMap = parsed && Object.keys(parsed).length ? parsed : SEED_HCID_MAP;

    const lastUpdatedText =
      json?.public_updated_at ||
      json?.updated_at ||
      json?.details?.change_history?.[0]?.public_timestamp ||
      null;

    return NextResponse.json({
      source: parsed ? "govuk-table" : "seed-fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText,
      map: effectiveMap,
    });
  } catch (err) {
    return NextResponse.json({
      source: "seed-fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText: null,
      map: SEED_HCID_MAP,
      error: String(err?.message || err),
    });
  }
}
