// src/app/api/who-don/route.js
// Fetch WHO Disease Outbreak News (DON), filter by countries + recency, and return a small payload.
// Query: /api/who-don?countries=France,Germany&days=365
// Returns: { source, fetchedAt, windowDays, byCountry: { [name]: Item[] } }

import { NextResponse } from "next/server";

const DEFAULT_DAYS = 365;

// Ask WHO for the newest items explicitly (OData params)
const WHO_ENDPOINTS = [
  "https://www.who.int/api/news/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=200",
  "https://www.who.int/api/news/outbreaks?$orderby=PublicationDate%20desc&$top=200",
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

// A few aliases so country matching is forgiving
const COUNTRY_ALIASES = {
  uk: ["united kingdom", "great britain", "england", "scotland", "wales", "northern ireland"],
  "cote divoire": ["cote d ivoire", "cote d’ivoire", "cote d'ivoire", "ivory coast"],
  drc: ["democratic republic of the congo", "congo democratic republic", "dr congo"],
  uae: ["united arab emirates"],
  usa: ["united states", "united states of america", "us"],
  "south korea": ["republic of korea", "korea republic"],
  myanmar: ["myanmar burma", "burma"],
  "türkiye": ["turkiye", "turkey"],
};

function expandCountryTerms(name) {
  const n = normalize(name);
  const out = new Set([n]);
  for (const [key, arr] of Object.entries(COUNTRY_ALIASES)) {
    if (n === key || arr.includes(n)) {
      out.add(key);
      arr.forEach((t) => out.add(t));
    }
  }
  return Array.from(out);
}

function withinDays(iso, days) {
  if (!iso) return false;
  try {
    const d = new Date(iso);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) <= days;
  } catch {
    return false;
  }
}

// Normalize WHO response items into a common shape
function normalizeItems(raw) {
  const arr =
    Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.value)
      ? raw.value
      : Array.isArray(raw?.results)
      ? raw.results
      : Array.isArray(raw?.data?.items)
      ? raw.data.items
      : [];

  return arr
    .map((it) => {
      // WHO DON frequently uses Title / ItemDefaultUrl / PublicationDate
      const Title =
        (typeof it.Title === "string" && it.Title) ||
        (typeof it.title === "string" && it.title) ||
        (typeof it.title?.rendered === "string" && it.title.rendered) ||
        it.headline ||
        it.name ||
        "";

      const Summary =
        (typeof it.Summary === "string" && it.Summary) ||
        (typeof it.summary === "string" && it.summary) ||
        (typeof it.excerpt === "string" && it.excerpt) ||
        (typeof it.excerpt?.rendered === "string" && it.excerpt.rendered) ||
        (typeof it.Overview === "string" && it.Overview) ||
        it.teaser ||
        it.body ||
        "";

      const Link =
        (typeof it.ItemDefaultUrl === "string" && it.ItemDefaultUrl) ||
        (typeof it.url === "string" && it.url) ||
        (typeof it.link === "string" && it.link) ||
        (typeof it.permalink === "string" && it.permalink) ||
        (it?.paths && `https://www.who.int${it.paths?.[0]}`) ||
        "";

      const dateRaw =
        it.PublicationDate ||
        it.FirstPublished ||
        it.DateCreated ||
        it.date ||
        it.publishedAt ||
        it.datePublished ||
        it.firstPublished ||
        it.published ||
        it.updated ||
        it.publicationDate ||
        "";

      const published = toISODate(dateRaw);

      return {
        title: typeof Title === "string" ? Title : "",
        summary: typeof Summary === "string" ? Summary : "",
        url: typeof Link === "string" ? Link : "",
        published,
      };
    })
    .filter((x) => x.title && x.url && x.published);
}

async function fetchWhoItems() {
  for (const url of WHO_ENDPOINTS) {
    try {
      const r = await fetch(url, {
        headers: { Accept: "application/json" },
        // cache at edge 6h; Next will revalidate
        next: { revalidate: 21600 },
      });
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
  const debug = searchParams.get("debug") === "1";



  const countries = countriesParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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

  const byCountry = {};
  for (const country of countries) {
    const terms = expandCountryTerms(country).map(normalize);
    const matched = [];

    for (const it of items) {
      if (!withinDays(it.published, windowDays)) continue;
      const hay = normalize(`${it.title} ${it.summary} ${it.url}`);
      if (terms.some((t) => hay.includes(t))) matched.push(it);
    }

    // Newest first, cap to 5 per country
    matched.sort((a, b) => (a.published < b.published ? 1 : -1));
    byCountry[country] = matched.slice(0, 5);
  }

  const debugInfo = debug
  ? {
      source,
      totalItemsFetched: items.length,
      sample: items.slice(0, 10).map((x) => ({ title: x.title, url: x.url, published: x.published })),
    }
  : undefined;

  return NextResponse.json(
  {
    source,
    fetchedAt: new Date().toISOString(),
    windowDays,
    byCountry,
    ...(debugInfo ? { debug: debugInfo } : {}),
  },
  { status: 200, headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400" } }
);
}
