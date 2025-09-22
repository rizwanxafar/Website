// src/data/countries.js
import countriesRaw from "world-countries";

/**
 * Normalize text for matching (lowercase, strip diacritics, punctuation, collapse spaces)
 */
function norm(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[.'’`]/g, "")          // strip punctuation that often varies
    .replace(/\s+/g, " ")
    .trim();
}

// Shape & light index
const COUNTRIES = countriesRaw.map((c) => ({
  code2: c.cca2,
  code3: c.cca3,
  name: c.name?.common || "",
  official: c.name?.official || "",
  alt: Array.isArray(c.altSpellings) ? c.altSpellings : [],
}));

// A few high-value aliases people actually type
const MANUAL_ALIASES = new Map([
  ["uk", "United Kingdom"],
  ["u k", "United Kingdom"],
  ["great britain", "United Kingdom"],
  ["england", "United Kingdom"],
  ["scotland", "United Kingdom"],
  ["wales", "United Kingdom"],
  ["northern ireland", "United Kingdom"],
  ["usa", "United States"],
  ["u s a", "United States"],
  ["us", "United States"],
  ["u s", "United States"],
  ["america", "United States"],
  ["united states of america", "United States"],
  ["uae", "United Arab Emirates"],
  ["u a e", "United Arab Emirates"],
  ["cote d ivoire", "Côte d’Ivoire"],
  ["cote d'ivoire", "Côte d’Ivoire"],
  ["drc", "Congo, The Democratic Republic of the"],
  ["democratic republic of congo", "Congo, The Democratic Republic of the"],
  ["south korea", "Korea, Republic of"],
  ["north korea", "Korea, Democratic People's Republic of"],
  ["laos", "Lao People's Democratic Republic"],
  ["vietnam", "Viet Nam"],
  ["russia", "Russian Federation"],
  ["bolivia", "Bolivia, Plurinational State of"],
]);

// Build suggestion list (deduped) for datalists
const suggestionSet = new Set();
COUNTRIES.forEach((c) => {
  if (c.name) suggestionSet.add(c.name);
  if (c.official) suggestionSet.add(c.official);
});
MANUAL_ALIASES.forEach((official) => suggestionSet.add(official));

export const COUNTRY_SUGGESTIONS = Array.from(suggestionSet).sort((a, b) =>
  a.localeCompare(b, undefined, { sensitivity: "base" })
);

// Sorted canonical list (common names)
export const COUNTRY_LIST = COUNTRIES
  .map((c) => c.name)
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

/**
 * Resolve user input to a canonical country (common) name if possible.
 * Falls back to the original input if no match is found.
 */
export function resolveCountryName(input) {
  const raw = String(input || "");
  const n = norm(raw);
  if (!n) return raw;

  // Manual alias first
  const aliasHit = MANUAL_ALIASES.get(n);
  if (aliasHit) return aliasHit;

  // Exact/common/official/alt match
  for (const c of COUNTRIES) {
    const namesToCheck = [c.name, c.official, ...(c.alt || [])].filter(Boolean);
    if (namesToCheck.some((x) => norm(x) === n)) return c.name;
  }

  // Prefix match
  const prefixHit = COUNTRIES.find((c) => norm(c.name).startsWith(n));
  if (prefixHit) return prefixHit.name;

  // Fall back
  return raw;
}
