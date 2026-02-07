import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // FALLBACK DATA (Offline Mode)
  const FALLBACK_INTEL = [
    { 
      title: "System Offline: Engaging Backup Data", 
      date: new Date().toISOString(), 
      link: "https://www.who.int/emergencies/disease-outbreak-news",
      description: "Unable to establish live connection to WHO servers. Displaying cached safety protocols."
    }
  ];

  // --- HELPER: TEXT CLEANER ---
  const cleanText = (html) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')    // Collapse whitespace
      .trim();
  };

  // --- HELPER: SMART LINK CONSTRUCTOR ---
  const constructLink = (item) => {
    // 1. Try explicit URL
    let url = item.ItemDefaultUrl || item.Link || "";
    
    // 2. If it's empty, try to build from ID
    if (!url && item.DonId) {
      url = item.DonId;
    }

    // 3. Clean it
    url = url.trim();

    // 4. Logic Tree
    if (url.startsWith("http")) return url;
    
    if (url.includes("/emergencies/")) {
      return `https://www.who.int${url.startsWith("/") ? "" : "/"}${url}`;
    }
    
    // 5. If it's just an ID (e.g. "2026-DON594")
    const cleanId = url.startsWith("/") ? url.substring(1) : url;
    return `https://www.who.int/emergencies/disease-outbreak-news/item/${cleanId}`;
  };

  try {
    // STRATEGY: JSON API
    // We revalidate every hour (3600), but you can increase this to 86400 for 24h if you prefer.
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=20", {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
    });

    if (res.ok) {
        const data = await res.json();
        const rawItems = data.value || data || [];

        const mappedItems = rawItems.map(item => {
          // 1. CONTENT CASCADE
          const rawBody = item.Summary || item.Overview || item.Epidemiology || item.Assessment || "";
          
          // 2. CLEANUP
          let summary = cleanText(rawBody);

          // 3. FALLBACK TEXT
          if (summary.length < 10) summary = "Detailed clinical data available in full report.";

          // 4. TRUNCATE
          if (summary.length > 220) summary = summary.substring(0, 220) + "...";

          return {
            title: item.Title || "Unknown Report",
            date: new Date(item.PublicationDate || item.Date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            rawDate: new Date(item.PublicationDate || item.Date), // Keep raw for sorting/latest check
            link: constructLink(item),
            description: summary
          };
        });
        
        return { items: mappedItems, source: "LIVE" };
    }
    throw new Error("API Failed");

  } catch (error) {
    console.warn("Intel Failure:", error);
    return { items: FALLBACK_INTEL, source: "BACKUP" };
  }
}

export default async function Page() {
  const { items, source } = await getWhoIntel();
  
  // 1. SERVER SYNC TIME (When did the code run?)
  const systemStatus = new Date().toLocaleString('en-GB', { 
    hour: '2-digit', minute: '2-digit', hour12: false 
  });

  // 2. DATA CURRENCY (When was the newest report published?)
  // We grab the date of the first item
  const latestReportRaw = items.length > 0 ? items[0].rawDate : new Date();
  const dataDate = new Date(latestReportRaw).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <ClinicalDashboard 
      intelData={items} 
      source={source} 
      systemStatus={systemStatus}
      dataDate={dataDate}
    />
  );
}
