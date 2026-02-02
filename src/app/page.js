import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- SERVER SIDE INTELLIGENCE GATHERING ---

async function getWhoIntel() {
  try {
    // 1. Fetch from WHO Internal API
    // We use a stealth User-Agent to ensure the WHO firewall treats us as a browser
    const res = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews", {
      next: { revalidate: 86400 }, // REVALIDATE: Once every 24 Hours (86400 seconds)
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!res.ok) throw new Error(`WHO Gatekeeper: ${res.status}`);

    // 2. Parse JSON
    const data = await res.json();
    
    // The API usually wraps items in 'value' or returns an array directly.
    // We check both to be robust.
    const items = data.value || data || [];

    // 3. Transform Data for Dashboard
    // We take the top 3 items, ensuring they are sorted by date
    return items
      .map(item => ({
        // Title might be nested or direct
        title: item.Title || item.title || "Unknown Alert",
        // Format Date: "02 Feb"
        date: new Date(item.PublicationDate || item.Date).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short' 
        }),
        // Fix relative URLs (e.g., "/emergencies/...")
        link: item.ItemDefaultUrl?.startsWith('http') 
          ? item.ItemDefaultUrl 
          : `https://www.who.int${item.ItemDefaultUrl || ''}`,
        // Raw date for sorting
        rawDate: new Date(item.PublicationDate || item.Date)
      }))
      .sort((a, b) => b.rawDate - a.rawDate) // Sort Newest First
      .slice(0, 3); // Take Top 3

  } catch (error) {
    console.error("Intel Failure:", error);
    // Return empty array to trigger "Offline" state in UI without crashing app
    return [];
  }
}

export default async function Page() {
  const intelData = await getWhoIntel();
  
  // Create a timestamp for when this page was generated (Cached Time)
  const lastSync = new Date().toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  }) + " (24H)";

  return (
    <ClinicalDashboard 
      intelData={intelData} 
      lastSync={lastSync}
    />
  );
}
