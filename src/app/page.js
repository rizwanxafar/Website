import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // 1. FALLBACK DATA (Safe Mode)
  // Used if BOTH JSON and RSS fail.
  const FALLBACK_INTEL = [
    { 
      title: "Nipah virus infection - West Bengal, India", 
      date: "30 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON593" 
    },
    { 
      title: "Marburg virus disease - Ethiopia", 
      date: "26 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON592" 
    },
    { 
      title: "Mpox - Region of the Americas", 
      date: "24 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news" 
    },
    { 
      title: "Yellow Fever - Colombia", 
      date: "22 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news" 
    },
    { 
      title: "Chikungunya - French Guiana", 
      date: "20 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news" 
    }
  ];

  // --- HELPER: DATA CLEANER ---
  const cleanAndSort = (items) => {
    return items
      .map(item => {
         // Normalized Link Logic
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
           rawDate: new Date(item.date)
         };
      })
      .sort((a, b) => b.rawDate - a.rawDate); // FORCE SORT (Newest First)
  };

  try {
    // 2. ATTEMPT A: JSON API (Preferred)
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
          link: item.ItemDefaultUrl
        }));

        const processed = cleanAndSort(mappedItems);

        // STALE CHECK
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        if (processed.length > 0 && processed[0].rawDate > ninetyDaysAgo) {
          return { items: processed, source: "LIVE" };
        }
        console.warn("JSON API returned stale data. Trying RSS...");
      }
    } catch (e) {
      console.warn("JSON API Failed. Switching to RSS Protocol...", e.message);
    }

    // 3. ATTEMPT B: RSS FEED (Failover)
    // If JSON fails/blocks, we hit the public RSS feed and Regex parse it (Server-Side)
    const rssRes = await fetch("https://www.who.int/feeds/entity/emergencies/disease-outbreak-news/en/rss.xml", {
       next: { revalidate: 3600 },
       headers: { "User-Agent": "Mozilla/5.0 (Compatible; ClinicalOS/1.0)" }
    });

    if (rssRes.ok) {
      const xmlText = await rssRes.text();
      
      // Simple Regex extraction to avoid XML libraries
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
      const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
      const linkRegex = /<link>(.*?)<\/link>/;

      const rssItems = [];
      let match;
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(titleRegex);
        const dateMatch = itemContent.match(dateRegex);
        const linkMatch = itemContent.match(linkRegex);

        if (titleMatch && dateMatch) {
          rssItems.push({
            title: titleMatch[1] || titleMatch[2],
            date: dateMatch[1],
            link: linkMatch ? linkMatch[1] : null
          });
        }
        if (rssItems.length >= 30) break;
      }

      if (rssItems.length > 0) {
        const processedRSS = cleanAndSort(rssItems);
        return { items: processedRSS, source: "LIVE" }; // RSS is considered Live
      }
    }

    // 4. TOTAL FAILURE -> BACKUP
    return { items: cleanAndSort(FALLBACK_INTEL.map(i => ({...i, date: new Date().toISOString()}))), source: "BACKUP" };

  } catch (error) {
    console.warn("Critical Intelligence Failure:", error.message);
    return { items: cleanAndSort(FALLBACK_INTEL.map(i => ({...i, date: new Date().toISOString()}))), source: "BACKUP" };
  }
}

export default async function Page() {
  const { items, source } = await getWhoIntel();
  
  const lastSync = new Date().toLocaleTimeString('en-GB', { 
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
