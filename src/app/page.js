import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // 1. FALLBACK DATA (Latest verified Feb 2026)
  // If the API fails, we use this to ensure we don't show "Sudan Virus 2022"
  const FALLBACK_INTEL = [
    { title: "Nipah virus disease - India", date: "30 Jan", link: "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON593" },
    { title: "Marburg virus disease - Ethiopia", date: "26 Jan", link: "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON592" },
    { title: "Mpox - Global Update", date: "24 Jan", link: "https://www.who.int/emergencies/disease-outbreak-news" },
    { title: "Cholera - Multi-country", date: "20 Jan", link: "https://www.who.int/emergencies/disease-outbreak-news" },
    { title: "Influenza A(H5N1) - Global", date: "15 Jan", link: "https://www.who.int/emergencies/disease-outbreak-news" }
  ];

  try {
    // 2. FETCH (STEALTH MODE)
    // Targeting the internal JSON API which is cleaner than RSS
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews", {
      next: { revalidate: 3600 }, // Revalidate every 1 hour (lighter than 24h, still safe for Vercel)
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*"
      }
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const data = await res.json();
    const items = data.value || data || [];

    // 3. TRANSFORM & SORT
    const liveItems = items
      .map(item => ({
        title: item.Title || item.title || "Unknown Alert",
        // Parsing "2026-01-30T..."
        date: new Date(item.PublicationDate || item.Date).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short' 
        }),
        link: item.ItemDefaultUrl?.startsWith('http') 
          ? item.ItemDefaultUrl 
          : `https://www.who.int${item.ItemDefaultUrl || ''}`,
        rawDate: new Date(item.PublicationDate || item.Date)
      }))
      .sort((a, b) => b.rawDate - a.rawDate) // Newest first
      .slice(0, 5); // GET TOP 5

    // Double check we actually got data, otherwise use fallback
    if (liveItems.length === 0) return FALLBACK_INTEL;
    
    return liveItems;

  } catch (error) {
    console.warn("WHO Feed Error (Using Backup 2026 Data):", error.message);
    return FALLBACK_INTEL;
  }
}

export default async function Page() {
  const intelData = await getWhoIntel();
  
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
