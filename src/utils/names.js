// src/utils/names.js
// Helpers for normalising country names and building a lookup map

export function normalizeName(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s'’`-]+/g, " ")
    .replace(/[()]/g, " ")
    .replace(/,+/g, " ")
    .replace(/\bthe\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// A few useful aliases to improve matching vs GOV.UK text
export const ALIASES = {
  [normalizeName("Türkiye")]: "turkey",
  [normalizeName("Democratic Republic of the Congo")]: "congo democratic republic",
  [normalizeName("Congo (Democratic Republic)")]: "congo democratic republic",
  [normalizeName("DR Congo")]: "congo democratic republic",
  [normalizeName("Congo, Democratic Republic of the")]: "congo democratic republic",
  [normalizeName("Republic of the Congo")]: "congo republic",
  [normalizeName("Congo (Republic)")]: "congo republic",
  [normalizeName("Côte d’Ivoire")]: "cote divoire",
  [normalizeName("Cote d'Ivoire")]: "cote divoire",
  [normalizeName("Swaziland")]: "eswatini",
  [normalizeName("Eswatini")]: "eswatini",
};

// Convert the raw { Country: [entries] } into a Map keyed by normalised names
export function buildNormalizedMap(riskMap) {
  const out = new Map();
  if (!riskMap) return out;
  for (const [rawName, entries] of Object.entries(riskMap)) {
    const norm = normalizeName(rawName);
    out.set(norm, Array.isArray(entries) ? entries : []);
  }
  return out;
}
