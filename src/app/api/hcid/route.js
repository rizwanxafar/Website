// src/app/api/hcid/route.js
import { NextResponse } from "next/server";

const GOVUK_API =
  "https://www.gov.uk/api/content/guidance/high-consequence-infectious-disease-country-specific-risk";

/** Seed fallback so we never give false reassurance if parsing fails. */
const SEED_HCID_MAP = {
  "Democratic Republic of the Congo": [
    { disease: "Ebola virus disease", evidence: "Endemic" },
  ],
  "Congo (Democratic Republic)": [
    { disease: "Ebola virus disease", evidence: "Endemic" },
  ],
  Uganda: [{ disease: "Marburg virus disease", evidence: "Endemic" }],
  Nigeria: [{ disease: "Lassa fever", evidence: "Endemic" }],
  Ghana: [{ disease: "Marburg virus disease", evidence: "Outbreak/Imported" }],
  Guinea: [{ disease: "Ebola virus disease", evidence: "Endemic/Outbreak" }],
  "Sierra Leone": [
    { disease: "Lassa fever", evidence: "Endemic" },
    { disease: "Ebola virus disease", evidence: "Outbreak (historical)" },
  ],
  Liberia: [
    { disease: "Ebola virus disease", evidence: "Outbreak (historical)" },
    { disease: "Lassa fever", evidence: "Endemic" },
  ],
  Sudan: [{ disease: "Ebola virus disease (Sudan virus)", evidence: "Outbreak (historical)" }],
  "South Sudan": [{ disease: "Ebola virus disease", evidence: "Outbreak (historical)" }],
  Afghanistan: [{ disease: "Crimean-Congo haemorrhagic fever", evidence: "Endemic/Outbreak" }],
  Pakistan: [{ disease: "Crimean-Congo haemorrhagic fever", evidence: "Endemic/Outbreak" }],
  Türkiye: [{ disease: "Crimean-Congo haemorrhagic fever", evidence: "Endemic/Outbreak" }],
  Turkey: [{ disease: "Crimean-Congo haemorrhagic fever", evidence: "Endemic/Outbreak" }],
  Iran: [{ disease: "Crimean-Congo haemorrhagic fever", evidence: "Endemic/Outbreak" }],
  Iraq: [{ disease: "Crimean-Congo haemorrhagic fever", evidence: "Endemic/Outbreak" }],
};

function stripTags(s = "") {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function bodyHtmlFromGovUk(json) {
  const blocks = json?.details?.body;
  if (Array.isArray(blocks)) {
    return blocks.map((b) => (typeof b === "string" ? b : b?.content || "")).join("\n");
  }
  if (typeof blocks === "string") return blocks;
  return "";
}

/**
 * Parse GOV.UK tables into:
 *  { [country]: [ { disease, evidence?, year? }, ... ] }
 * Handles:
 *  - header detection (Country | HCID disease | Evidence | Year)
 *  - rowspans (carry forward last seen country when a row's country cell is empty)
 *  - multiple diseases per cell (links, commas/semicolons/“and”, and <br> breaks)
 */
function parseTablesToDetailedMap(html) {
  if (!html) return null;

  const map = {};
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  const tables = html.match(tableRegex) || [];

  const getCells = (rowHtml) => {
    const cellRegex = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
    const cells = [];
    let m;
    while ((m = cellRegex.exec(rowHtml)) !== null) {
      const raw = m[2] || "";
      const text = stripTags(raw);
      cells.push({ raw, text });
    }
    return cells;
  };

  for (const table of tables) {
    const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
    const rows = table.match(rowRegex) || [];
    if (!rows.length) continue;

    // Detect header indices if there's a header row
    let idxCountry = 0, idxDisease = 1, idxEvidence = 2, idxYear = 3;
    const headerRow = rows.find((r) => /<th/i.test(r));
    if (headerRow) {
      const headers = getCells(headerRow).map((c) => c.text.toLowerCase());
      const findIdx = (keys) => {
        for (const key of keys) {
          const i = headers.findIndex((h) => h.includes(key));
          if (i !== -1) return i;
        }
        return -1;
      };
      const cIdx = findIdx(["country", "territory"]);
      const dIdx = findIdx(["hcid", "disease"]);
      const eIdx = findIdx(["evidence"]);
      const yIdx = findIdx(["year", "date"]);
      idxCountry = cIdx !== -1 ? cIdx : idxCountry;
      idxDisease = dIdx !== -1 ? dIdx : idxDisease;
      idxEvidence = eIdx !== -1 ? eIdx : idxEvidence;
      idxYear = yIdx !== -1 ? yIdx : idxYear;
    }

    let lastCountry = null; // carry forward across rowspan

    for (const row of rows) {
      // Skip header
      const isHeader = /<th/i.test(row);
      if (isHeader) continue;

      const cells = getCells(row);
      if (!cells.length) continue;

      // Country: use text from country cell if present; otherwise fallback to lastCountry (rowspan)
      const countryCell = cells[idxCountry];
      const countryText = (countryCell?.text || "").trim();
      let country = countryText || lastCountry;

      // Skip grouping rows like "Countries A to D"
      if (country && /countries\s+[a-z]\s+to\s+[a-z]/i.test(country)) {
        lastCountry = null;
        continue;
      }

      if (!country) continue; // still nothing usable
      lastCountry = country;  // remember for subsequent rowspan rows

      // Disease cell
      const diseaseCell = cells[idxDisease];
      // Evidence & year
      const evidenceText = (cells[idxEvidence]?.text || "").trim() || undefined;
      const yearText = (cells[idxYear]?.text || "").trim() || undefined;

      let diseases = [];
      if (diseaseCell) {
        const raw = diseaseCell.raw || "";

        // 1) Collect link texts
        const linkTextMatches = [
          ...(raw.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)) || [],
        ].map((mm) => stripTags(mm[1] || "")).filter(Boolean);

        // 2) Split on <br> (any variant)
        const withBrSplits = raw
          .replace(/<br\s*\/?>/gi, "\n")
          .split("\n")
          .map((chunk) => stripTags(chunk).trim())
          .filter(Boolean);

        // Combine: links + text splits
        let candidates = linkTextMatches.length ? linkTextMatches : withBrSplits;

        // If still empty, use the plain text
        if (!candidates.length) {
          const plain = (diseaseCell.text || "").trim();
          if (plain) candidates = [plain];
        }

        // Flatten and split further on separators ; , / and "and"
        diseases = candidates
          .flatMap((s) => s.split(/;|,|\/|\band\b/gi))
          .map((s) => s.trim())
          .filter(Boolean);

        // Handle explicit "None" / "No known"
        if (diseases.length === 1 && /^none\b|^no known\b/i.test(diseases[0])) {
          diseases = [];
        }
      }

      // Ensure map entry
      if (!Object.prototype.hasOwnProperty.call(map, country)) {
        map[country] = [];
      }

      if (diseases.length === 0) {
        // Record explicit "no HCIDs" only if nothing recorded yet
        if (map[country].length === 0) {
          map[country] = [];
        }
      } else {
        for (const d of diseases) {
          if (!d) continue;
          const dup = map[country].some(
            (e) =>
              e.disease.toLowerCase() === d.toLowerCase() &&
              (evidenceText ? e.evidence === evidenceText : true) &&
              (yearText ? e.year === yearText : true)
          );
          if (!dup) {
            map[country].push({
              disease: d,
              ...(evidenceText ? { evidence: evidenceText } : {}),
              ...(yearText ? { year: yearText } : {}),
            });
          }
        }
      }
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
    const parsed = parseTablesToDetailedMap(html);

    // Build fallback in the same shape
    const fallback =
      Object.fromEntries(
        Object.entries(SEED_HCID_MAP).map(([country, arr]) => [
          country,
          arr.map((e) => (typeof e === "string" ? { disease: e } : e)),
        ])
      ) || {};

    const effectiveMap = parsed && Object.keys(parsed).length ? parsed : fallback;

    const lastUpdatedText =
      json?.public_updated_at ||
      json?.updated_at ||
      json?.details?.change_history?.[0]?.public_timestamp ||
      null;

    return NextResponse.json({
      source: parsed ? "govuk-table+rowspan" : "seed-fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText,
      map: effectiveMap,
    });
  } catch (err) {
    const fallback =
      Object.fromEntries(
        Object.entries(SEED_HCID_MAP).map(([country, arr]) => [
          country,
          arr.map((e) => (typeof e === "string" ? { disease: e } : e)),
        ])
      ) || {};
    return NextResponse.json({
      source: "seed-fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText: null,
      map: fallback,
      error: String(err?.message || err),
    });
  }
}
