import countries from "world-countries";
import aliases from "@/data/country-aliases.json";

// Build canonical set of names
const CANONICAL = new Set(countries.map(c => c.name.common));

// Given user input, return canonical country name if match/alias exists
export function resolveCountry(input) {
  if (!input) return "";

  // Normalise
  const q = input.trim();

  // 1. Exact canonical match
  if (CANONICAL.has(q)) return q;

  // 2. Alias match
  if (aliases[q]) return aliases[q];

  // 3. Case-insensitive match
  const lower = q.toLowerCase();
  const canonMatch = Array.from(CANONICAL).find(c => c.toLowerCase() === lower);
  if (canonMatch) return canonMatch;

  // 4. Fallback: return what they typed
  return q;
}

export default resolveCountry;
