import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // 1. FALLBACK DATA (Safe Mode)
  // We use the generic main index link for these to prevent 404 errors on guessed IDs.
  const FALLBACK_INTEL = [
    { 
      title: "Nipah virus infection - West Bengal, India", 
      date: "30 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news" 
    },
    { 
      title: "Marburg virus disease - Ethiopia", 
      date: "26 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news" 
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

  try {
    // 2. FETCH
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

    // 3. TRANSFORM & SANITIZE
    const liveItems = rawItems
      .map(item => {
        // Robust Link Construction
        let link = "https://www.who.int/emergencies/disease-outbreak-news";
        if (item.ItemDefaultUrl) {
          // If it starts with http, use it. If it starts with /, prepend domain.
          if (item.ItemDefaultUrl.startsWith('http')) {
            link = item.ItemDefaultUrl;
          } else if (item.ItemDefaultUrl.startsWith('/')) {
            link = `https://www.who.int${item.ItemDefaultUrl}`;
          }
        }

        return {
          title: item.Title || item.title || "Unknown Alert",
          date: new Date(item.PublicationDate || item.Date).toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short' 
          }),
          link: link,
          rawDate: new Date(item.PublicationDate || item.Date)
        };
      });

    // 4. STALE DATA GUARD
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
