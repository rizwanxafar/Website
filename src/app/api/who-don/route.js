// src/app/api/who-don/route.js
// Fetch WHO Disease Outbreak News (DON), filter by countries + recency, and return a small payload.
// Query: /api/who-don?countries=India,Nigeria&days=365
// Returns: { source, fetchedAt, windowDays, byCountry: { [name]: Item[] }, debug? }

import { NextResponse } from "next/server";

const DEFAULT_DAYS = 365;

// Ask WHO for the newest items explicitly (OData params). Use a larger $top to cover a year.
const WHO_ENDPOINTS = [
  "https://www.who.int/api/news/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=500",
  "https://www.who.int/api/news/outbreaks?$orderby=PublicationDate%20desc&$top=500",
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

// Country alias helpers
const COUNTRY_ALIASES = {
  uk: ["united kingdom", "great britain", "england", "scotland", "wales", "northern ireland"],
  "cote divoire": ["cote d ivoire", "cote d’ivoire", "cote d'ivoire", "ivory coast"],
  drc: ["democratic republic of the congo", "congo democratic republic", "dr congo", "congo (democratic republic)"],
  uae: ["united arab emirates"],
  usa: ["united states", "united states of america", "us", "u.s."],
  "south korea": ["republic of korea", "korea republic"],
  myanmar: ["myanmar burma", "burma"],
  "türkiye": ["turkiye", "turkey", "tuerkiye"],
  "czechia": ["czech republic"],
};

function expandCountryTerms(name) {
  const n = normalize(name);
  const out = new Set([n]);
  for (const [key, arr] of Object.entries(COUNTRY_ALIASES)) {
    if (n === key || arr.includes(n)) {
      out.add(key);
      arr.forEach((t) => out.add(normalize(t)));
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

// Extract an array of country names from common WHO fields and normalise them
function extractCountries(it) {
  const bucket = new Set();

  // A helper to push strings safely
  const add = (val) => {
    if (!val) return;
    if (typeof val === "string") {
      const n = normalize(val);
      if (n) bucket.add(n);
    }
  };

  // WHO items sometimes use these fields
  // Try plural forms first, then singulars, then nested arrays/objects.
  const tryFields = [
    "Countries",
    "countries",
    "Locations",
    "locations",
    "Location",
    "Country",
    "Region",
    "Regions",
  ];

  for (const key of tryFields) {
    const v = it?.[key];
    if (!v) continue;

    if (Array.isArray(v)) {
      for (const x of v) {
        if (typeof x === "string") add(x);
        else if (x && typeof x === "object") {
          // Sometimes { Title: "India" } or { Name: "India" }
          add(x.Title || x.Name || x.title || x.name);
        }
      }
    } else if (typeof v === "string") {
      // May be "India; Bangladesh" or "India, Bangladesh"
      v.split(/[;,]/).forEach((piece) => add(piece));
    } else if (typeof v === "object") {
      add(v.Title || v.Name || v.title || v.name);
    }
  }

  // Heuristic: if title includes a hyphen " – India" or "(India)" etc.
  const title = (it.Title || it.title || it.headline || "").toString();
  const titleN = normalize(title);
  // Common suffix/patterns: " – India", " — India", "(India)"
  const possible = titleN
    .replace(/[()]/g, " ")
    .split(/[–—-]/) // dashes
    .map((s) => s.trim());
  for (const tok of possible) {
    // Single words like "india", or phrases like "west africa"
    if (tok && tok.length <= 20) bucket.add(tok);
  }

  // Return as array
  return Array.from(bucket);
}

// Normalize WHO response into common items, including structured `countries`
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
      const countries = extractCountries(it);

      return {
        title: typeof Title === "string" ? Title : "",
        summary: typeof Summary === "string" ? Summary : "",
        url: typeof Link === "string" ? Link : "",
        published,
        countries, // array of normalised country/location strings
      };
    })
    .filter((x) => x.title && x.url && x.published);
}

async function fetchWhoItems() {
  for (const url of WHO_ENDPOINTS) {
    try {
      const r = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 21600 }, // 6h revalidate
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
  const hayItems = items.filter((it) => withinDays(it.published, windowDays));

  for (const country of countries) {
    const terms = expandCountryTerms(country); // normalised variants
    const termSet = new Set(terms.map((t) => normalize(t)));
    const out = [];

    for (const it of hayItems) {
      // 1) Structured country match
      const structuredHit = (it.countries || []).some((c) => termSet.has(c));

      // 2) Text match (title + summary + URL)
      const hay = normalize(`${it.title} ${it.summary} ${it.url}`);
      const textHit = Array.from(termSet).some((t) => hay.includes(t));

      if (structuredHit || textHit) out.push(it);
    }

    out.sort((a, b) => (a.published < b.published ? 1 : -1));
    byCountry[country] = out.slice(0, 5);
  }

  const payload = {
    source,
    fetchedAt: new Date().toISOString(),
    windowDays,
    byCountry,
  };

  if (debug) {
    payload.debug = {
      totalFetched: items.length,
      totalWithinWindow: hayItems.length,
      sample: hayItems.slice(0, 8).map((x) => ({
        title: x.title,
        published: x.published,
        url: x.url,
        countries: x.countries,
      })),
    };
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
