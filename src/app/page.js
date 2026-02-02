import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // 1. FALLBACK DATA (Safe Mode)
  // Used if WHO API is down or blocked.
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
      title: "Mpox - Region of the Americas (Situation Report)", 
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
    },
     { 
      title: "Cholera - Zimbabwe (Update)", 
      date: "12 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news" 
    },
    { 
      title: "Dengue - Global Overview", 
      date: "10 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news" 
    }
  ];

  try {
    // 2. FETCH (Top 30 items for the scrollable list)
    // Removed the filter, so we just take the raw feed.
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=30", {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const data = await res.json();
    const rawItems = data.value || data || [];

    // 3. TRANSFORM & REPAIR URLS
    const processedItems = rawItems.map(item => {
        const title = item.Title || item.title || "Unknown Alert";
        const rawUrl = item.ItemDefaultUrl || "";
        
        // Link Repair Logic
        let finalLink = "https://www.who.int/emergencies/disease-outbreak-news";
        if (rawUrl) {
           if (rawUrl.startsWith('http')) finalLink = rawUrl;
           else if (rawUrl.includes('/emergencies/')) finalLink = `https://www.who.int${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`;
           else finalLink = `https://www.who.int/emergencies/disease-outbreak-news/item${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`;
        }

        return {
          title: title,
          date: new Date(item.PublicationDate || item.Date).toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short' 
          }),
          link: finalLink,
          rawDate: new Date(item.PublicationDate || item.Date)
        };
    });

    // 4. STALE DATA GUARD (90 Days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    if (processedItems.length > 0 && processedItems[0].rawDate < ninetyDaysAgo) {
      console.warn("WHO API Stale. Serving Backup.");
      return { items: FALLBACK_INTEL, source: "BACKUP" }; 
    }

    if (processedItems.length > 0) {
      return { items: processedItems, source: "LIVE" };
    }

    return { items: FALLBACK_INTEL, source: "BACKUP" };

  } catch (error) {
    console.warn("WHO Feed Error:", error.message);
    return { items: FALLBACK_INTEL, source: "BACKUP" };
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
