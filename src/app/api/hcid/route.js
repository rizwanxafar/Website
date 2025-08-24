// src/app/api/hcid/route.js
import { NextResponse } from "next/server";
import { HCID_FALLBACK_MAP, HCID_SNAPSHOT_DATE } from "@/data/hcidFallbackSnapshot";

const GOVUK_API =
  "https://www.gov.uk";

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
 *  - rowspans (carry forward last seen country when a row’s country cell is empty)
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

    // Detect column indices from header if present
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

    let lastCountry = null; // carry forward across rowspan groups

    for (const row of rows) {
      if (/<th/i.test(row)) continue; // skip header rows
      const cells = getCells(row);
      if (!cells.length) continue;

      // Country: read from cell if present; otherwise use lastCountry (rowspan effect)
      const countryCell = cells[idxCountry];
      const countryText = (countryCell?.text || "").trim();
      let country = countryText || lastCountry;

      // Skip grouping rows like "Countries A to D"
      if (country && /countries\s+[a-z]\s+to\s+[a-z]/i.test(country)) {
        lastCountry = null;
        continue;
      }
      if (!country) continue;

      lastCountry = country; // remember for subsequent rows in a rowspan

      // Disease, Evidence, Year
      const diseaseCell = cells[idxDisease];
      const evidenceText = (cells[idxEvidence]?.text || "").trim() || undefined;
      const yearText = (cells[idxYear]?.text || "").trim() || undefined;

      let diseases = [];
      if (diseaseCell) {
        const raw = diseaseCell.raw || "";

        // 1) extract link texts if present
        const linkTexts = [
          ...(raw.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)) || [],
        ]
          .map((mm) => stripTags(mm[1] || ""))
          .filter(Boolean);

        // 2) split on <br> into separate lines, strip HTML and trim
        const brSplit = raw
          .replace(/<br\s*\/?>/gi, "\n")
          .split("\n")
          .map((chunk) => stripTags(chunk).trim())
          .filter(Boolean);

        // prefer link texts if present, else use <br>-split chunks, else plain text
        let candidates = linkTexts.length ? linkTexts : brSplit;
        if (!candidates.length) {
          const plain = (diseaseCell.text || "").trim();
          if (plain) candidates = [plain];
        }

        // Split further on separators ; , / and "and"
        diseases = candidates
          .flatMap((s) => s.split(/;|,|\/|\band\b/gi))
          .map((s) => s.trim())
          .filter(Boolean);

        // explicit “None/No known”
        if (diseases.length === 1 && /^none\b|^no known\b/i.test(diseases[0])) {
          diseases = [];
        }
      }

      // Ensure map entry
      if (!Object.prototype.hasOwnProperty.call(map, country)) {
        map[country] = [];
      }

      if (diseases.length === 0) {
        // record explicit “no HCIDs” only if nothing added yet
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
      next: { revalidate: 60 * 60 * 24 }, // cache on Vercel for 24h
      headers: { "User-Agent": "IDNorthwest/1.0 (+https://idnorthwest.co.uk)" },
    });
    if (!res.ok) throw new Error(`GOV.UK fetch failed: ${res.status}`);

    const json = await res.json();
    const html = bodyHtmlFromGovUk(json);
    const parsed = parseTablesToDetailedMap(html);

    const effectiveMap = parsed && Object.keys(parsed).length ? parsed : HCID_FALLBACK_MAP;

    const lastUpdatedText =
      json?.public_updated_at ||
      json?.updated_at ||
      json?.details?.change_history?.[0]?.public_timestamp ||
      null;

    return NextResponse.json({
      source: parsed ? "govuk-table+rowspan" : "snapshot-fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText,
      map: effectiveMap,
      snapshotDate: parsed ? null : HCID_SNAPSHOT_DATE,
    });
  } catch (err) {
    return NextResponse.json({
      source: "snapshot-fallback",
      fetchedAt: new Date().toISOString(),
      lastUpdatedText: null,
      map: HCID_FALLBACK_MAP,
      snapshotDate: HCID_SNAPSHOT_DATE,
      error: String(err?.message || err),
    });
  }
}
