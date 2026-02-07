import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // 1. FALLBACK DATA (Static)
  const FALLBACK_INTEL = [
    { 
      title: "Nipah virus infection - West Bengal, India", 
      date: "30 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON593",
      description: "A confirmed case of Nipah virus infection has been reported in West Bengal. Health authorities are conducting contact tracing."
    },
    { 
      title: "Marburg virus disease - Ethiopia", 
      date: "26 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON592",
      description: "The outbreak in Ethiopia has been declared over following 42 days with no new confirmed cases reported."
    },
    { 
      title: "Mpox - Region of the Americas", 
      date: "24 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news",
      description: "Surveillance data indicates a steady decline in cases across the region, though clusters remain in specific urban centers."
    },
    { 
      title: "Yellow Fever - Colombia", 
      date: "22 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news",
      description: "New sylvatic cases have been identified. Vaccination campaigns are being intensified in affected municipalities."
    }
  ];

  // --- HELPER: INTELLIGENCE PARSER ---
  const extractSituation = (htmlContent, fallbackSummary) => {
    if (!htmlContent) return fallbackSummary || "";

    // 1. Define the Start and End markers (Case Insensitive)
    // We look for "Situation at a glance" and stop at "Description of the situation"
    const pattern = /(?:Situation at a glance|At a glance)([\s\S]*?)(?:Description of the situation|Epidemiology|Public health response)/i;
    const match = htmlContent.match(pattern);

    let rawText = "";

    if (match && match[1]) {
      // Found the specific section
      rawText = match[1];
    } else {
      // If markers are missing, take the first 300 chars of the whole thing
      rawText = htmlContent;
    }

    // 2. Clean HTML Tags (Remove <p>, <strong>, <br>, etc.)
    const cleanText = rawText
      .replace(/<[^>]*>?/gm, ' ') // Replace tags with space
      .replace(/\s+/g, ' ')       // Collapse multiple spaces
      .trim();

    // 3. Truncate for UI (Max 220 chars)
    return cleanText.length > 220 ? cleanText.substring(0, 220) + "..." : cleanText;
  };

  // --- HELPER: SORTING ---
  const cleanAndSort = (items) => {
    return items
      .map(item => {
         let finalLink = "https://www.who.int/emergencies/disease-outbreak-news";
         if (item.link) {
            if (item.link.startsWith('http')) finalLink = item.link;
            else if (item.link.includes('/emergencies/')) finalLink = `https://www.who.int${item.link.startsWith('/') ? item.link : '/' + item.link}`;
            else finalLink = `https://www.who.int/emergencies/disease-outbreak-news/item${item.link.startsWith('/') ? item.link : '/' + item.link}`;
         }

         return {
           title: item.title || "Unknown Alert",
           date: new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
           link: finalLink,
           description: extractSituation(item.rawBody, item.description), // USE THE EXTRACTOR
           rawDate: new Date(item.date)
         };
      })
      .sort((a, b) => b.rawDate - a.rawDate);
  };

  try {
    // 2. PRIMARY STRATEGY: RSS FEED
    // Why RSS? Because it consistently includes the HTML body in the <description> tag,
    // which allows our Regex to find "Situation at a glance". The JSON list often hides this.
    const rssRes = await fetch("https://www.who.int/feeds/entity/emergencies/disease-outbreak-news/en/rss.xml", {
       next: { revalidate: 3600 },
       headers: { "User-Agent": "Mozilla/5.0 (Compatible; ClinicalOS/1.0)" }
    });

    if (rssRes.ok) {
      const xmlText = await rssRes.text();
      
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
      const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
      const linkRegex = /<link>(.*?)<\/link>/;
      // Capture the FULL description HTML for parsing
      const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/;

      const rssItems = [];
      let match;
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(titleRegex);
        const dateMatch = itemContent.match(dateRegex);
        const linkMatch = itemContent.match(linkRegex);
        const descMatch = itemContent.match(descRegex);

        // Get the raw HTML payload
        const rawBody = descMatch ? (descMatch[1] || descMatch[2]) : "";

        if (titleMatch && dateMatch) {
          rssItems.push({
            title: titleMatch[1] || titleMatch[2],
            date: dateMatch[1],
            link: linkMatch ? linkMatch[1] : null,
            rawBody: rawBody, // Pass raw HTML to the cleaner
            description: ""   // Will be generated by cleaner
          });
        }
        if (rssItems.length >= 30) break;
      }

      if (rssItems.length > 0) {
        const processedRSS = cleanAndSort(rssItems);
        return { items: processedRSS, source: "LIVE" };
      }
    }

    // 3. FALLBACK: JSON API
    // If RSS fails, we try JSON, though it might lack the full body text.
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=30", {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
    });

    if (res.ok) {
        const data = await res.json();
        const rawItems = data.value || data || [];
        const mappedItems = rawItems.map(item => ({
          title: item.Title || item.title,
          date: item.PublicationDate || item.Date,
          link: item.ItemDefaultUrl,
          rawBody: item.Description || item.IntroText || "" // Best effort
        }));
        return { items: cleanAndSort(mappedItems), source: "LIVE" };
    }

    return { items: cleanAndSort(FALLBACK_INTEL.map(i => ({...i, date: new Date().toISOString()}))), source: "BACKUP" };

  } catch (error) {
    console.warn("Critical Intelligence Failure:", error.message);
    return { items: cleanAndSort(FALLBACK_INTEL.map(i => ({...i, date: new Date().toISOString()}))), source: "BACKUP" };
  }
}

export default async function Page() {
  const { items, source } = await getWhoIntel();
  
  const lastSync = new Date().toLocaleString('en-GB', { 
    day: 'numeric',
    month: 'short',
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <ClinicalDashboard 
      intelData={items} 
      source={source} 
      lastSync={lastSync}
    />
  );
}
