import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- REGION DERIVATION ---
// WHO DON titles follow "Disease – Country" or "Disease – Region phrase".
// We parse the tail of the title, match known WHO region phrases first,
// then fall back to a country → WHO-region lookup.
const REGION_PHRASES = [
  ["African Region", "Africa"],
  ["Region of the Americas", "Americas"],
  ["South-East Asia Region", "South-East Asia"],
  ["South-East Asia", "South-East Asia"],
  ["European Region", "Europe"],
  ["Eastern Mediterranean Region", "Eastern Mediterranean"],
  ["Eastern Mediterranean", "Eastern Mediterranean"],
  ["Western Pacific Region", "Western Pacific"],
];

// Country → WHO region label. Starter set; extend as new countries appear
// in the WHO feed. Spelling matches WHO DON title conventions (e.g. "Türkiye").
const COUNTRY_TO_REGION = {
  // African Region
  "Algeria": "Africa", "Angola": "Africa", "Benin": "Africa", "Botswana": "Africa",
  "Burkina Faso": "Africa", "Burundi": "Africa", "Cabo Verde": "Africa", "Cameroon": "Africa",
  "Central African Republic": "Africa", "Chad": "Africa", "Comoros": "Africa", "Congo": "Africa",
  "Côte d'Ivoire": "Africa", "Cote d'Ivoire": "Africa",
  "Democratic Republic of the Congo": "Africa", "Equatorial Guinea": "Africa",
  "Eritrea": "Africa", "Eswatini": "Africa", "Ethiopia": "Africa", "Gabon": "Africa",
  "Gambia": "Africa", "Ghana": "Africa", "Guinea": "Africa", "Guinea-Bissau": "Africa",
  "Kenya": "Africa", "Lesotho": "Africa", "Liberia": "Africa", "Madagascar": "Africa",
  "Malawi": "Africa", "Mali": "Africa", "Mauritania": "Africa", "Mauritius": "Africa",
  "Mozambique": "Africa", "Namibia": "Africa", "Niger": "Africa", "Nigeria": "Africa",
  "Rwanda": "Africa", "Sao Tome and Principe": "Africa", "Senegal": "Africa",
  "Seychelles": "Africa", "Sierra Leone": "Africa", "South Africa": "Africa",
  "South Sudan": "Africa", "Tanzania": "Africa", "United Republic of Tanzania": "Africa",
  "Togo": "Africa", "Uganda": "Africa", "Zambia": "Africa", "Zimbabwe": "Africa",

  // Region of the Americas
  "Argentina": "Americas", "Bahamas": "Americas", "Barbados": "Americas", "Belize": "Americas",
  "Bolivia": "Americas", "Brazil": "Americas", "Canada": "Americas", "Chile": "Americas",
  "Colombia": "Americas", "Costa Rica": "Americas", "Cuba": "Americas", "Dominica": "Americas",
  "Dominican Republic": "Americas", "Ecuador": "Americas", "El Salvador": "Americas",
  "Grenada": "Americas", "Guatemala": "Americas", "Guyana": "Americas", "Haiti": "Americas",
  "Honduras": "Americas", "Jamaica": "Americas", "Mexico": "Americas", "Nicaragua": "Americas",
  "Panama": "Americas", "Paraguay": "Americas", "Peru": "Americas",
  "Saint Kitts and Nevis": "Americas", "Saint Lucia": "Americas",
  "Saint Vincent and the Grenadines": "Americas", "Suriname": "Americas",
  "Trinidad and Tobago": "Americas", "United States": "Americas",
  "United States of America": "Americas", "Uruguay": "Americas", "Venezuela": "Americas",

  // South-East Asia Region
  "Bangladesh": "South-East Asia", "Bhutan": "South-East Asia",
  "Democratic People's Republic of Korea": "South-East Asia", "India": "South-East Asia",
  "Indonesia": "South-East Asia", "Maldives": "South-East Asia",
  "Myanmar": "South-East Asia", "Nepal": "South-East Asia", "Sri Lanka": "South-East Asia",
  "Thailand": "South-East Asia", "Timor-Leste": "South-East Asia",

  // European Region
  "Albania": "Europe", "Andorra": "Europe", "Armenia": "Europe", "Austria": "Europe",
  "Azerbaijan": "Europe", "Belarus": "Europe", "Belgium": "Europe",
  "Bosnia and Herzegovina": "Europe", "Bulgaria": "Europe", "Croatia": "Europe",
  "Cyprus": "Europe", "Czechia": "Europe", "Denmark": "Europe", "Estonia": "Europe",
  "Finland": "Europe", "France": "Europe", "Georgia": "Europe", "Germany": "Europe",
  "Greece": "Europe", "Hungary": "Europe", "Iceland": "Europe", "Ireland": "Europe",
  "Israel": "Europe", "Italy": "Europe", "Kazakhstan": "Europe", "Kyrgyzstan": "Europe",
  "Latvia": "Europe", "Lithuania": "Europe", "Luxembourg": "Europe", "Malta": "Europe",
  "Monaco": "Europe", "Montenegro": "Europe", "Netherlands": "Europe",
  "North Macedonia": "Europe", "Norway": "Europe", "Poland": "Europe", "Portugal": "Europe",
  "Republic of Moldova": "Europe", "Romania": "Europe", "Russian Federation": "Europe",
  "San Marino": "Europe", "Serbia": "Europe", "Slovakia": "Europe", "Slovenia": "Europe",
  "Spain": "Europe", "Sweden": "Europe", "Switzerland": "Europe", "Tajikistan": "Europe",
  "Türkiye": "Europe", "Turkey": "Europe", "Turkmenistan": "Europe", "Ukraine": "Europe",
  "United Kingdom": "Europe",
  "United Kingdom of Great Britain and Northern Ireland": "Europe",
  "Uzbekistan": "Europe",

  // Eastern Mediterranean Region
  "Afghanistan": "Eastern Mediterranean", "Bahrain": "Eastern Mediterranean",
  "Djibouti": "Eastern Mediterranean", "Egypt": "Eastern Mediterranean",
  "Iran": "Eastern Mediterranean", "Iran (Islamic Republic of)": "Eastern Mediterranean",
  "Iraq": "Eastern Mediterranean", "Jordan": "Eastern Mediterranean",
  "Kuwait": "Eastern Mediterranean", "Lebanon": "Eastern Mediterranean",
  "Libya": "Eastern Mediterranean", "Morocco": "Eastern Mediterranean",
  "Oman": "Eastern Mediterranean", "Pakistan": "Eastern Mediterranean",
  "Qatar": "Eastern Mediterranean", "Saudi Arabia": "Eastern Mediterranean",
  "Somalia": "Eastern Mediterranean", "Sudan": "Eastern Mediterranean",
  "Syria": "Eastern Mediterranean", "Syrian Arab Republic": "Eastern Mediterranean",
  "Tunisia": "Eastern Mediterranean", "United Arab Emirates": "Eastern Mediterranean",
  "Yemen": "Eastern Mediterranean",

  // Western Pacific Region
  "Australia": "Western Pacific", "Brunei Darussalam": "Western Pacific",
  "Cambodia": "Western Pacific", "China": "Western Pacific",
  "Cook Islands": "Western Pacific", "Fiji": "Western Pacific", "Japan": "Western Pacific",
  "Kiribati": "Western Pacific", "Lao People's Democratic Republic": "Western Pacific",
  "Malaysia": "Western Pacific", "Marshall Islands": "Western Pacific",
  "Micronesia": "Western Pacific", "Mongolia": "Western Pacific", "Nauru": "Western Pacific",
  "New Zealand": "Western Pacific", "Niue": "Western Pacific", "Palau": "Western Pacific",
  "Papua New Guinea": "Western Pacific", "Philippines": "Western Pacific",
  "Republic of Korea": "Western Pacific", "Samoa": "Western Pacific",
  "Singapore": "Western Pacific", "Solomon Islands": "Western Pacific",
  "Tonga": "Western Pacific", "Tuvalu": "Western Pacific", "Vanuatu": "Western Pacific",
  "Viet Nam": "Western Pacific", "Vietnam": "Western Pacific",
};

function deriveRegion(title) {
  if (!title) return null;
  const parts = title.split(/\s[–—-]\s/);
  if (parts.length < 2) return null;
  const tail = parts[parts.length - 1].trim();

  for (const [phrase, label] of REGION_PHRASES) {
    if (tail.includes(phrase)) return label;
  }

  const parenMatch = tail.match(/\(([^)]+)\)/);
  if (parenMatch) {
    for (const [phrase, label] of REGION_PHRASES) {
      if (parenMatch[1].includes(phrase)) return label;
    }
  }

  const country = tail.replace(/\s*\(.+?\)\s*/g, "").trim();
  return COUNTRY_TO_REGION[country] || null;
}

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // FALLBACK DATA (Offline Mode)
  const FALLBACK_INTEL = [
    {
      title: "System Offline: Engaging Backup Data",
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      link: "https://www.who.int/emergencies/disease-outbreak-news",
      description: "Unable to establish live connection to WHO servers. Displaying cached safety protocols.",
      region: null,
    }
  ];

  // --- HELPER: TEXT CLEANER ---
  const cleanText = (html) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')    // Collapse whitespace
      .trim();
  };

  // --- HELPER: SMART LINK CONSTRUCTOR ---
  const constructLink = (item) => {
    // 1. Try explicit URL
    let url = item.ItemDefaultUrl || item.Link || "";
    
    // 2. If it's empty, try to build from ID
    if (!url && item.DonId) {
      url = item.DonId;
    }

    // 3. Clean it
    url = url.trim();

    // 4. Logic Tree
    if (url.startsWith("http")) return url;
    
    if (url.includes("/emergencies/")) {
      return `https://www.who.int${url.startsWith("/") ? "" : "/"}${url}`;
    }
    
    // 5. If it's just an ID (e.g. "2026-DON594")
    const cleanId = url.startsWith("/") ? url.substring(1) : url;
    return `https://www.who.int/emergencies/disease-outbreak-news/item/${cleanId}`;
  };

  try {
    // STRATEGY: JSON API
    // We revalidate every hour (3600), but you can increase this to 86400 for 24h if you prefer.
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=20", {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
    });

    if (res.ok) {
        const data = await res.json();
        const rawItems = data.value || data || [];

        const mappedItems = rawItems.map(item => {
          // 1. CONTENT CASCADE
          const rawBody = item.Summary || item.Overview || item.Epidemiology || item.Assessment || "";
          
          // 2. CLEANUP
          let summary = cleanText(rawBody);

          // 3. FALLBACK TEXT
          if (summary.length < 10) summary = "Detailed clinical data available in full report.";

          // 4. TRUNCATE
          if (summary.length > 220) summary = summary.substring(0, 220) + "...";

          return {
            title: item.Title || "Unknown Report",
            date: new Date(item.PublicationDate || item.Date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            link: constructLink(item),
            description: summary,
            region: deriveRegion(item.Title),
          };
        });
        
        return { items: mappedItems, source: "LIVE" };
    }
    throw new Error("API Failed");

  } catch (error) {
    console.warn("Intel Failure:", error);
    return { items: FALLBACK_INTEL, source: "BACKUP" };
  }
}

export default async function Page() {
  const { items } = await getWhoIntel();
  return <ClinicalDashboard intelData={items} />;
}
