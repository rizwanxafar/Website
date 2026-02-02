import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // 1. FALLBACK DATA (Safe Links)
  // We point these to the main DONs page to guarantee NO 404s.
  // The user will see these items listed at the top of that page.
  const FALLBACK_INTEL = [
    { 
      title: "Nipah virus infection - West Bengal, India", 
      date: "30 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news" 
    },
    { 
      title: "Marburg virus disease - Ethiopia (Outbreak End)", 
      date: "26 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news" 
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
    }
  ];

  try {
    // 2. FETCH LIVE DATA
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=10", {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const data = await res.json();
    const rawItems = data.value || data || [];

    // 3. TRANSFORM & SAFE-LINK GENERATION
    const liveItems = rawItems
      .map(item => {
        const title = item.Title || item.title || "Unknown Alert";
        
        // --- SAFE LINK LOGIC ---
        // 1. Try to get the default URL
        let finalLink = "https://www.who.int/emergencies/disease-outbreak-news";
        
        if (item.ItemDefaultUrl) {
           // If it's a full URL, trust it (mostly)
           if (item.ItemDefaultUrl.startsWith('http')) {
             finalLink = item.ItemDefaultUrl;
           } 
           // If it's a relative path, prepend WHO domain
           else if (item.ItemDefaultUrl.startsWith('/')) {
             finalLink = `https://www.who.int${item.ItemDefaultUrl}`;
           }
        } else {
           // FAIL-SAFE: If no URL provided, create a Google Search for this specific title on WHO site
           // This guarantees the user finds the article even if the link map is broken.
           const searchSlug = encodeURIComponent(`site:who.int "${title}"`);
           finalLink = `https://www.google.com/search?q=${searchSlug}`;
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

    if (liveItems.length > 0 && liveItems[0].rawDate < ninetyDaysAgo) {
      console.warn("WHO API Stale. Serving Backup.");
      return { items: FALLBACK_INTEL, source: "BACKUP" };
    }

    if (liveItems.length > 0) {
      return { items: liveItems.slice(0, 5), source: "LIVE" };
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
