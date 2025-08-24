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
  Ghana: [{ disease: "Marburg virus disease", evidence: "Imported/Outbreak" }],
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
 * Columns are typically: Country | HCID disease | Evidence | Year
 * We detect header indices when possible; otherwise assume the first 4 columns.
 */
function parseTablesToDetailedMap(html) {
  if (!html) return null;

  const map = {};
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  const tables = html.match(tableRegex) || [];

  const getCells = (row) => {
    const cellRegex = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
    const cells = [];
    let m;
    while ((m = cellRegex.exec(row)) !== null) {
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

    // Determine column indices from header if present
    let idxCountry = 0;
    let idxDisease = 1;
    let idxEvidence = 2;
    let idxYear = 3;

    // Look for a header row with <th>
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

    for (const row of rows) {
      const isHeader = /<th/i.test(row);
      const cells = getCells(row);
      if (!cells.length) continue;
      if (isHeader) continue; // skip header row

      const country = cells[idxCountry]?.text?.trim() || "";
      if (!country) continue;
      if (/countries\s+[a-z]\s+to\s+[a-z]/i.test(country)) continue; // grouping row

      const diseaseCell = cells[idxDisease];
      const evidenceCell = cells[idxEvidence];
      const yearCell = cells[idxYear];

      // Disease text: prefer link text(s) if present
      let diseases = [];
      if (diseaseCell) {
        const linkTextMatches = [
          ...(diseaseCell.raw.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)) || [],
        ]
          .map((mm) => stripTags(mm[1] || ""))
          .filter(Boolean);

        const diseasePlain = (diseaseCell.text || "").trim();

        if (linkTextMatches.length) {
          diseases = linkTextMatches;
        } else if (diseasePlain) {
          if (/^none\b|^no known\b/i.test(diseasePlain)) {
            diseases = []; // explicit none
          } else {
            const split = diseasePlain
              .split(/;|,|\/|\band\b/gi)
              .map((s) => s.trim())
              .filter(Boolean);
            diseases = split.length ? split : [diseasePlain];
          }
        }
      }

      const evidenceText = (evidenceCell?.text || "").trim() || undefined;
      const yearText = (yearCell?.text || "").trim() || undefined;

      // Ensure country key exists
      if (!Object.prototype.hasOwnProperty.call(map, country)) {
        map[country] = [];
      }

      if (diseases.length === 0) {
        // If explicitly none, ensure empty array recorded (don't overwrite existing entries)
        if (map[country].length === 0) {
          map[country] = [];
        }
      } else {
        for (const d of diseases) {
          if (!d) continue;
          // Avoid exact duplicates
          const already = map[country].some(
            (e) =>
              e.disease.toLowerCase() === d.toLowerCase() &&
              (evidenceText ? e.evidence === evidenceText : true) &&
              (yearText ? e.year === yearText : true)
          );
          if (!already) {
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
      next: { revalidate: 60 * 60 * 24 }, // 24h cache (Vercel)
      headers: { "User-Agent": "IDNorthwest/1.0 (+https://idnorthwest.co.uk)" },
    });
    if (!res.ok) throw new Error(`GOV.UK fetch failed: ${res.status}`);

    const json = await res.json();
    const html = bodyHtmlFromGovUk(json);
    const parsed = parseTablesToDetailedMap(html);

    // If parse fails, convert the seed shape into the same detailed form
    const fallback =
      Object.fromEntries(
        Object.entries(SEED_HCID_MAP).map(([country, arr]) => [
          country,
          arr.map((e) =>
            typeof e === "string" ? { disease: e } : e
          ),
        ])
      ) || {};

    const effectiveMap = parsed && Object.keys(parsed).length ? parsed : fallback;

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
    // Network or unexpected failure: detailed seed fallback
    const fallback =
      Object.fromEntries(
        Object.entries(SEED_HCID_MAP).map(([country, arr]) => [
          country,
          arr.map((e) =>
            typeof e === "string" ? { disease: e } : e
          ),
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
