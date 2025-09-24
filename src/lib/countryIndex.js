import countries from "world-countries";

const NAME_TO_ISO2 = new Map(
  countries.map(c => [c.name.common, c.cca2]) // e.g. "United States" -> "US"
);

export function nameToIso2(countryName) {
  return NAME_TO_ISO2.get(countryName) || null;
}
