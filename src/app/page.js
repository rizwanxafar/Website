import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // 1. FALLBACK DATA (With Descriptions)
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
    },
    { 
      title: "Chikungunya - French Guiana", 
      date: "20 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news",
      description: "Vector control measures have been implemented following an increase in reported arboviral activity."
    },
     { 
      title: "Cholera - Zimbabwe", 
      date: "12 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news",
      description: "The cholera situation remains critical with new cases reported in Harare. WHO is supporting the local response."
    },
    { 
      title: "Dengue - Global Overview", 
      date: "10 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news",
      description: "Global dengue incidence has risen significantly compared to the previous year, driven by climate factors."
    }
  ];

  // --- HELPER: TEXT CLEANER ---
  // Strips HTML tags and truncates to ~140 chars
  const cleanDescription = (text) => {
    if (!text) return "Details available in full report.";
    const stripped = text.replace(/<[^>]*>?/gm, ''); // Remove HTML
    return stripped.length > 140 ? stripped.substring(0, 140) + "..." : stripped;
  };

  // --- HELPER: SORTING ---
  const cleanAndSort = (items) => {
    return items
      .map(item => {
         // Link Logic
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
           description: cleanDescription(item.description), // Clean the description
           rawDate: new Date(item.date)
         };
      })
      .sort((a, b) => b.rawDate - a.rawDate);
  };

  try {
    // 2. ATTEMPT A: JSON API
    try {
      const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=30", {
        next: { revalidate: 3600 },
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });

      if (res.ok) {
        const data = await res.json();
        const rawItems = data.value || data || [];
        
        const mappedItems = rawItems.map(item => ({
          title: item.Title || item.title,
          date: item.PublicationDate || item.Date,
          link: item.ItemDefaultUrl,
          // Try to find description in common OData fields
          description: item.Description || item.IntroText || item.Abstract || "" 
        }));

        const processed = cleanAndSort(mappedItems);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        if (processed.length > 0 && processed[0].rawDate > ninetyDaysAgo) {
          return { items: processed, source: "LIVE" };
        }
        console.warn("JSON API returned stale data. Trying RSS...");
      }
    } catch (e) {
      console.warn("JSON API Failed. Switching to RSS...", e.message);
    }

    // 3. ATTEMPT B: RSS FEED
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
      const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/;

      const rssItems = [];
      let match;
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(titleRegex);
        const dateMatch = itemContent.match(dateRegex);
        const linkMatch = itemContent.match(linkRegex);
        const descMatch = itemContent.match(descRegex);

        if (titleMatch && dateMatch) {
          rssItems.push({
            title: titleMatch[1] || titleMatch[2],
            date: dateMatch[1],
            link: linkMatch ? linkMatch[1] : null,
            description: descMatch ? (descMatch[1] || descMatch[2]) : ""
          });
        }
        if (rssItems.length >= 30) break;
      }

      if (rssItems.length > 0) {
        const processedRSS = cleanAndSort(rssItems);
        return { items: processedRSS, source: "LIVE" };
      }
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
