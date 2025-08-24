// src/app/api/who-don/route.js
// Server route: fetch WHO Disease Outbreak News (and fallback sources), filter by countries & recency.
// Query: /api/who-don?countries=France,Germany&days=365
// Returns: { source: string, fetchedAt: ISO, windowDays: number, byCountry: { [name]: Item[] } }

import { NextResponse } from "next/server";

const DEFAULT_DAYS = 365;
// Try these endpoints in order; structure may vary over time.
const WHO_ENDPOINTS = [
  "https://www.who.int/api/news/diseaseoutbreaknews",
  "https://www.who.int/api/news/outbreaks",
];

function toISODate(d) {
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return null;
    return dt.toISOString();
  } catch {
    return null;
  }
}

function normalize(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Some light aliases to catch common variations (you can extend later)
const COUNTRY_ALIASES = {
  "uk": ["united kingdom", "great britain", "england", "scotland", "wales", "northern ireland"],
  "cote divoire": ["cote d ivoire", "cote d’ivoire", "cote d'ivoire", "ivory coast"],
  "drc": ["democratic republic of the congo", "congo democratic republic", "dr congo"],
  "uae": ["united arab emirates"],
  "usa": ["united states", "united states of america", "us"],
  "south korea": ["republic of korea", "korea republic"],
  "myanmar": ["myanmar burma", "burma"],
  "türkiye": ["turkiye", "turkey"], // WHO sometimes uses Türkiye
};

function expandCountryTerms(name) {
  const n = normalize(name);
  const terms = new Set([n]);
  for (const [key, arr] of Object.entries(COUNTRY_ALIASES)) {
    if (n === key || arr.includes(n)) {
      terms.add(key);
      arr.forEach((t) => terms.add(t));
    }
  }
  return Array.from(terms);
}

function withinDays(iso, days) {
  if (!iso) return false;
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= days;
  } catch {
    return false;
  }
}

// Try to parse different WHO shapes into a common list
function normalizeItems(raw) {
  const arr = Array.isArray(raw) ? raw : raw?.items || raw?.value || raw?.results || [];
  return arr
    .map((it) => {
      // Try common field names:
      const title =
        it.title?.rendered || it.title || it.headline || it.name || it.slug || "";
      const summary =
        it.summary || it.excerpt || it.excerpt?.rendered || it.body || it.teaser || "";
      const url =
        it.url || it.link || it.permalink || (it?.paths && `https://www.who.int${it.paths?.[0]}`) || "";
      const dateRaw =
        it.date || it.publishedAt || it.datePublished || it.firstPublished || it.published || it.updated || "";
      const published = toISODate(dateRaw);

      return {
        title: typeof title === "string" ? title : "",
        summary: typeof summary === "string" ? summary : "",
        url: typeof url === "string" ? url : "",
        published,
        raw: it,
      };
    })
    .filter((x) => x.title && x.url && x.published);
}

async function fetchWhoItems() {
  for (const url of WHO_ENDPOINTS) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 21600 } });
      if (!r.ok) continue;
      const data = await r.json();
      const items = normalizeItems(data);
      if (items.length > 0) return { source: url, items };
    } catch {
      // try next endpoint
    }
  }
  return { source: "none", items: [] };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const countriesParam = searchParams.get("countries") || "";
  const windowDays = parseInt(searchParams.get("days") || "", 10) || DEFAULT_DAYS;

  // Parse countries list
  const countries = countriesParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // If no countries provided, return empty
  if (countries.length === 0) {
    return NextResponse.json(
      {
        source: "none",
        fetchedAt: new Date().toISOString(),
        windowDays,
        byCountry: {},
        note: "No countries supplied.",
      },
      { status: 200, headers: { "Cache-Control": "private, max-age=60" } }
    );
  }

  const { source, items } = await fetchWhoItems();

  // Build index by country
  const byCountry = {};
  const nowISO = new Date().toISOString();

  for (const country of countries) {
    const terms = expandCountryTerms(country);
    const termStrs = terms.map((t) => normalize(t));
    const out = [];

    for (const it of items) {
      if (!withinDays(it.published, windowDays)) continue;

      const hay = normalize(`${it.title} ${it.summary}`);
      const match = termStrs.some((t) => hay.includes(t));
      if (match) out.push(it);
    }

    // Sort newest first, cap to 5
    out.sort((a, b) => (a.published < b.published ? 1 : -1));
    byCountry[country] = out.slice(0, 5);
  }

  return NextResponse.json(
    {
      source,
      fetchedAt: nowISO,
      windowDays,
      byCountry,
    },
    {
      status: 200,
      headers: {
        // Cache at the edge for 6h, allow stale-while-revalidate
        "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400",
      },
    }
  );
}
