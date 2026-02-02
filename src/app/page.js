import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // 1. FALLBACK DATA (Verified Feb 2026 Surveillance)
  // This activates if the API fails, is blocked, or returns data older than 90 days.
  const FALLBACK_INTEL = [
    { 
      title: "Nipah virus infection - West Bengal, India", 
      date: "30 Jan", 
      link: "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON593" 
    },
    { 
      title: "Marburg virus disease - Ethiopia (Outbreak End)", 
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
    }
  ];

  try {
    // 2. FETCH WITH SORTING
    // We add $orderby=PublicationDate desc to force newest items first.
    // We also use $top=10 to get a slightly larger pool to filter from.
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=10", {
      next: { revalidate: 3600 }, // Revalidate every 1 hour
      headers: {
        // Mimic a standard browser to avoid WAF (Firewall) blocks
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const data = await res.json();
    // The API structure can vary (sometimes wrapped in 'value', sometimes direct array)
    const rawItems = data.value || data || [];

    // 3. TRANSFORM
    const liveItems = rawItems
      .map(item => ({
        title: item.Title || item.title || "Unknown Alert",
        // Parsing the date cleanly
        date: new Date(item.PublicationDate || item.Date).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short' 
        }),
        // Fix relative URLs if necessary
        link: item.ItemDefaultUrl?.startsWith('http') 
          ? item.ItemDefaultUrl 
          : `https://www.who.int${item.ItemDefaultUrl || ''}`,
        // Keep raw date for the Stale Guard check
        rawDate: new Date(item.PublicationDate || item.Date)
      }));

    // 4. STALE DATA GUARD
    // If the top item is older than 90 days, the API is returning "Featured/Old" content
    // instead of chronological news. We reject it to prevent showing 2022 data.
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    if (liveItems.length > 0 && liveItems[0].rawDate < ninetyDaysAgo) {
      console.warn("WHO API returned stale data (Older than 90 days). Switching to Fallback.");
      return FALLBACK_INTEL;
    }

    // 5. FINAL SLICE
    // If data is fresh and exists, return top 5
    if (liveItems.length > 0) {
      return liveItems.slice(0, 5);
    }

    return FALLBACK_INTEL;

  } catch (error) {
    console.warn("WHO Feed Error (Using Backup 2026 Data):", error.message);
    return FALLBACK_INTEL;
  }
}

// --- MAIN PAGE COMPONENT ---

export default async function Page() {
  const intelData = await getWhoIntel();
  
  // Generate a server-side timestamp for the display
  const lastSync = new Date().toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <ClinicalDashboard 
      intelData={intelData} 
      lastSync={lastSync}
    />
  );
}
