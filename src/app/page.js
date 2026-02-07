import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  
  // FALLBACK DATA (If WHO servers are totally down)
  const FALLBACK_INTEL = [
    { 
      title: "System Offline: Engaging Backup Data", 
      date: new Date().toISOString(), 
      link: "https://www.who.int/emergencies/disease-outbreak-news",
      description: "Unable to establish live connection to WHO servers."
    }
  ];

  // --- HELPER: TEXT CLEANER ---
  const cleanText = (html) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, '') // Strip ALL tags
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')    // Collapse whitespace
      .trim();
  };

  // --- HELPER: LINK FIXER ---
  const fixLink = (url) => {
    if (!url) return "#";
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith("http")) return cleanUrl;
    // Fix relative links (e.g., "/emergencies/...")
    if (cleanUrl.startsWith("/")) return `https://www.who.int${cleanUrl}`;
    return `https://www.who.int/${cleanUrl}`;
  };

  try {
    // STRATEGY: JSON API (It is faster and usually has the relative links)
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=20", {
        next: { revalidate: 3600 },
        headers: { 
          "User-Agent": "Mozilla/5.0", 
          "Accept": "application/json" 
        }
    });

    if (res.ok) {
        const data = await res.json();
        const rawItems = data.value || data || [];

        // MAP & CLEAN
        const mappedItems = rawItems.map(item => {
          
          // 1. DYNAMIC FIELD HUNTING
          // We look for ANY field that might contain the text
          const rawBody = item.Description || item.description || item.IntroText || item.introText || item.Body || item.body || "";
          
          // 2. CLEANUP
          let summary = cleanText(rawBody);

          // 3. IF SUMMARY IS STILL EMPTY, USE TITLE
          if (summary.length < 5) {
             summary = "New disease outbreak reported. Click for full official details.";
          }

          // 4. TRUNCATE
          if (summary.length > 200) summary = summary.substring(0, 200) + "...";

          return {
            title: item.Title || item.title || "Unknown Report",
            // Date formatting
            date: new Date(item.PublicationDate || item.Date || new Date()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            // LINK FIX APPLIED HERE
            link: fixLink(item.ItemDefaultUrl || item.url || item.Link),
            description: summary,
            // DEBUG FIELD: Let's see what keys are actually available
            debugKeys: Object.keys(item).join(", ")
          };
        });
        
        return { items: mappedItems, source: "LIVE (API)" };
    }

    throw new Error("API Failed");

  } catch (error) {
    console.error("Intel Failure:", error);
    return { items: FALLBACK_INTEL, source: "BACKUP" };
  }
}

export default async function Page() {
  const { items, source } = await getWhoIntel();
  
  const lastSync = new Date().toLocaleString('en-GB', { 
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false 
  });

  return (
    <div className="bg-black min-h-screen">
       {/* DEBUG PANEL: REMOVE THIS ONCE WORKING */}
       <div className="fixed bottom-0 left-0 w-full bg-red-900/90 text-red-100 p-2 text-[10px] font-mono z-50 border-t border-red-500 overflow-x-auto whitespace-nowrap">
         <strong>DEBUG (First Item Keys):</strong> {items[0]?.debugKeys || "No Data"} 
         <span className="mx-4">|</span>
         <strong>Link Example:</strong> {items[0]?.link}
       </div>

      <ClinicalDashboard 
        intelData={items} 
        source={source} 
        lastSync={lastSync}
      />
    </div>
  );
}
