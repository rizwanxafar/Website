import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // 1. FALLBACK DATA (Static - For offline/error states)
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
    }
  ];

  // --- HELPER: ROBUST INTELLIGENCE PARSER ---
  const extractSituation = (htmlContent, fallbackSummary) => {
    if (!htmlContent) return fallbackSummary || "No detailed intelligence available.";

    // STEP A: Clean specific WHO noise
    let clean = htmlContent
      .replace(/&nbsp;/g, ' ')  // Kill non-breaking spaces
      .replace(/&amp;/g, '&')   // Fix ampersands
      .replace(/[\r\n]+/g, ' '); // Flatten newlines

    // STRATEGY 1: "Situation at a glance" Target
    // We look for the header, then capture everything until the next header-like bold/strong/h tag
    const specificMatch = clean.match(/(?:Situation at a glance|At a glance|Summary)([\s\S]*?)(?:Description of the situation|Epidemiology|Public health response|<h[1-6]|<strong)/i);
    
    let rawText = "";

    if (specificMatch && specificMatch[1] && specificMatch[1].length > 20) {
      rawText = specificMatch[1];
    } else {
      // STRATEGY 2: First Paragraph Recon
      // Find the first <p> tag that has substantial text (>50 chars)
      const pMatch = clean.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (pMatch && pMatch[1] && pMatch[1].length > 50) {
        rawText = pMatch[1];
      } else {
        // STRATEGY 3: Brute Force
        // Just take the whole body
        rawText = clean;
      }
    }

    // FINAL CLEANUP: Strip all HTML tags
    const plainText = rawText
      .replace(/<[^>]*>?/gm, '') // Remove tags
      .replace(/\s+/g, ' ')      // Collapse spaces
      .trim();

    // Truncate cleanly
    return plainText.length > 200 ? plainText.substring(0, 200).trim() + "..." : plainText;
  };

  // --- HELPER: SORTING & LINK FIXING ---
  const cleanAndSort = (items) => {
    return items
      .map(item => {
         // Fix relative links often found in JSON feeds
         let finalLink = "https://www.who.int/emergencies/disease-outbreak-news";
         if (item.link) {
            if (item.link.startsWith('http')) finalLink = item.link;
            else finalLink = `https://www.who.int${item.link.startsWith('/') ? '' : '/'}${item.link}`;
         }

         return {
           title: item.title || "Unknown Alert",
           // Format: 07 Feb
           date: new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
           link: finalLink,
           description: extractSituation(item.rawBody, item.description),
           rawDate: new Date(item.date)
         };
      })
      .sort((a, b) => b.rawDate - a.rawDate);
  };

  try {
    // 2. PRIMARY STRATEGY: RSS FEED
    // WHO RSS is reliable for providing the full HTML body in <description>
    const rssRes = await fetch("https://www.who.int/feeds/entity/emergencies/disease-outbreak-news/en/rss.xml", {
       next: { revalidate: 3600 },
       headers: { "User-Agent": "Mozilla/5.0 (Compatible; ClinicalOS/1.0)" }
    });

    if (rssRes.ok) {
      const xmlText = await rssRes.text();
      
      // RSS Regex Parsers
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/;
      const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
      const linkRegex = /<link>(.*?)<\/link>/;
      // Capture CDATA or standard text for description
      const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/;

      const rssItems = [];
      let match;
      
      // Limit to 20 items to keep processing fast
      let count = 0;
      while ((match = itemRegex.exec(xmlText)) !== null && count < 20) {
        count++;
        const itemContent = match[1];
        
        const titleMatch = itemContent.match(titleRegex);
        const dateMatch = itemContent.match(dateRegex);
        const linkMatch = itemContent.match(linkRegex);
        const descMatch = itemContent.match(descRegex);

        if (titleMatch && dateMatch) {
          rssItems.push({
            title: titleMatch[1],
            date: dateMatch[1],
            link: linkMatch ? linkMatch[1] : null,
            rawBody: descMatch ? descMatch[1] : "", // Pass full HTML to extractor
            description: "" // Placeholder
          });
        }
      }

      if (rssItems.length > 0) {
        return { items: cleanAndSort(rssItems), source: "LIVE" };
      }
    }

    // 3. SECONDARY STRATEGY: JSON API
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=20", {
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
          // JSON sometimes has 'IntroText' which is cleaner than Description
          rawBody: item.IntroText || item.Description || "" 
        }));
        
        return { items: cleanAndSort(mappedItems), source: "LIVE (API)" };
    }

    throw new Error("Both feeds failed");

  } catch (error) {
    console.warn("Intel System Offline, engaging backup protocols:", error.message);
    return { 
      items: cleanAndSort(FALLBACK_INTEL.map(i => ({...i, date: new Date().toISOString()}))), 
      source: "BACKUP" 
    };
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
