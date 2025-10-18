// src/utils/names.js
// Single source for normalising country names + aliases.

function _n(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")                 // split accents
    .replace(/[\u0300-\u036f]/g, "")  // drop accents
    .replace(/[’'‘`"]/g, " ")         // unify quotes to space
    .replace(/[^a-z0-9\s-]/g, " ")    // drop other punctuation
    .replace(/\bthe\b/g, " ")         // drop leading “the”
    .replace(/\s+/g, " ")             // collapse spaces
    .trim();
}

// Aliases map: keys and values are already normalised strings.
export const ALIASES = new Map([
  // Myanmar/Burma
  [_n("Burma"), _n("Myanmar")],
  [_n("Myanma"), _n("Myanmar")],

  // DRC variants
  [_n("DR Congo"), _n("Democratic Republic of the Congo")],
  [_n("Congo (Democratic Republic)"), _n("Democratic Republic of the Congo")],
  [_n("Congo, Democratic Republic of the"), _n("Democratic Republic of the Congo")],
  [_n("Congo-Kinshasa"), _n("Democratic Republic of the Congo")],

  // Republic of the Congo variants
  [_n("Republic of the Congo"), _n("Republic of the Congo")],
  [_n("Congo (Republic)"), _n("Republic of the Congo")],
  [_n("Congo-Brazzaville"), _n("Republic of the Congo")],

  // Türkiye
  [_n("Türkiye"), _n("Turkey")],

  // Côte d’Ivoire variants
  [_n("Côte d’Ivoire"), _n("Cote d Ivoire")],
  [_n("Cote d'Ivoire"), _n("Cote d Ivoire")],
  [_n("Cote d’ivoire"), _n("Cote d Ivoire")],
  [_n("Cote d Ivore"), _n("Cote d Ivoire")],
  [_n("Ivory Coast"), _n("Cote d Ivoire")],

  // Eswatini
  [_n("Swaziland"), _n("Eswatini")],
  [_n("Eswatini"), _n("Eswatini")],
]);

export function normalizeName(s = "") {
  const base = _n(s);
  const aliased = ALIASES.get(base) || base;
  return aliased;
}

// Convert raw { country: entries[] } into Map keyed by normalised+aliased names
export function buildNormalizedMap(riskMap) {
  const out = new Map();
  if (!riskMap) return out;
  for (const [rawName, entries] of Object.entries(riskMap)) {
    const key = normalizeName(rawName);
    out.set(key, Array.isArray(entries) ? entries : []);
  }
  return out;
}
