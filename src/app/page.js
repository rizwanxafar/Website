import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // 1. FALLBACK DATA (Manual Override - Pure Outbreaks Only)
  // I have manually stripped any "Global" or "SitRep" items from this list
  // so if the API fails, you still get a clean list.
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
      title: "Western Equine Encephalitis - Uruguay", 
      date: "15 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news" 
    }
  ];

  // --- THE NUCLEAR FILTER ---
  // We define the filter logic here so we can apply it to BOTH Live and Backup data
  const filterOutbreaks = (items) => {
    return items.filter(item => {
      const t = (item.title || "").toLowerCase();
      
      // BAN LIST: If the title contains ANY of these, it dies.
      const isBanned = 
        t.includes("situation report") || 
        t.includes("surveillance") || 
        t.includes("update") || 
        t.includes("global") || // Banning "Global" gets rid of general stats
        t.includes("review") ||
        t.includes("questions");

      return !isBanned;
    });
  };

  try {
    // 2. FETCH (Request 25 items to ensure we have enough after filtering)
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=25", {
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
        
        // Link Repair Logic (The "Safe Link" fix)
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

    // 4. APPLY NUCLEAR FILTER
    const cleanItems = filterOutbreaks(processedItems);

    // 5. STALE DATA GUARD
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    if (cleanItems.length > 0 && cleanItems[0].rawDate < ninetyDaysAgo) {
      console.warn("WHO API Stale. Serving Backup.");
      return { items: FALLBACK_INTEL, source: "BACKUP" }; // Backup is already pure
    }

    if (cleanItems.length > 0) {
      return { items: cleanItems.slice(0, 5), source: "LIVE" };
    }

    // If filter removed everything, return backup
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
