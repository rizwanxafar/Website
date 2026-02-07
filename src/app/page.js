import ClinicalDashboard from "@/components/ClinicalDashboard";

// --- CONFIGURATION ---
// Set this to TRUE if you still see "No detailed intelligence" to see raw data on screen.
const DEBUG_MODE = false; 

// --- SERVER SIDE INTELLIGENCE GATHERING ---
async function getWhoIntel() {
  
  const FALLBACK_INTEL = [
    { 
      title: "System Offline: Engaging Backup Data", 
      date: new Date().toISOString(), 
      link: "#",
      description: "Unable to establish live connection to WHO servers. displaying cached safety protocols."
    }
  ];

  // --- HELPER: ROBUST HTML CLEANER ---
  const cleanHTML = (html) => {
    if (!html) return "";
    return html
      .replace(/<!\[CDATA\[/g, '') // Strip CDATA start
      .replace(/\]\]>/g, '')       // Strip CDATA end
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/<[^>]*>/g, '')     // Strip all tags
      .replace(/\s+/g, ' ')        // Collapse whitespace
      .trim();
  };

  // --- HELPER: SMART EXTRACTOR ---
  const extractSituation = (rawHtml, fallbackSummary) => {
    if (!rawHtml) return fallbackSummary || "No detailed intelligence available.";

    // 1. Try to find "Situation at a glance" (Case Insensitive)
    // We look for the phrase, then capture text until the next Header-like pattern
    const situationMatch = rawHtml.match(/(?:Situation at a glance|At a glance|Summary)([\s\S]*?)(?:Description of the situation|Epidemiology|Public health response|<h[1-6]|<strong)/i);
    
    let textToClean = "";

    if (situationMatch && situationMatch[1].length > 50) {
      // Hit: Found the specific section
      textToClean = situationMatch[1];
    } else {
      // Miss: Fallback to the first substantial paragraph
      const pMatch = rawHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (pMatch && pMatch[1].length > 50) {
        textToClean = pMatch[1];
      } else {
        // Critical Miss: Just use the whole body
        textToClean = rawHtml;
      }
    }

    const clean = cleanHTML(textToClean);
    return clean.length > 220 ? clean.substring(0, 220) + "..." : clean;
  };

  try {
    // STRATEGY A: RSS FEED (Priority)
    // We use a "Loose Regex" that doesn't care about attributes like <description class="...">
    const rssRes = await fetch("https://www.who.int/feeds/entity/emergencies/disease-outbreak-news/en/rss.xml", {
       next: { revalidate: 3600 },
       headers: { "User-Agent": "Mozilla/5.0 (Compatible; ClinicalOS/1.0)" }
    });

    if (rssRes.ok) {
      const xmlText = await rssRes.text();
      
      // PARSER: We manually loop to avoid complex Regex lookaheads
      const items = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      
      let match;
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        
        // 1. Extract Title
        const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
        
        // 2. Extract Date
        const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
        
        // 3. Extract Link
        const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
        
        // 4. Extract Description (THE FIX: Loose matching for attributes)
        // Matches <description> OR <description ...> OR <content:encoded>
        const descMatch = itemContent.match(/<(?:description|content:encoded)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|content:encoded)>/);

        if (titleMatch && dateMatch) {
          items.push({
            title: titleMatch[1],
            date: dateMatch[1],
            link: linkMatch ? linkMatch[1] : "#",
            rawBody: descMatch ? descMatch[1] : "", // Now captures properly
            source: "RSS"
          });
        }
      }

      if (items.length > 0) {
        return { 
          items: items.map(item => ({
             title: item.title,
             date: new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
             link: item.link,
             description: extractSituation(item.rawBody, ""),
             debug: DEBUG_MODE ? item.rawBody.substring(0, 50) : null
          })), 
          source: "LIVE" 
        };
      }
    }

    // STRATEGY B: JSON API (Fallback)
    const apiRes = await fetch("https://www.who.int/api/emergencies/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=20", {
        next: { revalidate: 3600 }
    });

    if (apiRes.ok) {
        const data = await apiRes.json();
        const rawItems = data.value || data || [];
        
        const mappedItems = rawItems.map(item => {
          // JSON fields are often inconsistently capitalized
          const body = item.Description || item.description || item.IntroText || item.introText || "";
          
          return {
            title: item.Title || item.title,
            date: new Date(item.PublicationDate || item.Date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            link: item.ItemDefaultUrl || "https://www.who.int/emergencies/disease-outbreak-news",
            description: extractSituation(body, "Update available - click for details"),
            debug: DEBUG_MODE ? body.substring(0, 50) : null
          };
        });
        
        return { items: mappedItems, source: "LIVE (API)" };
    }

    throw new Error("All feeds failed");

  } catch (error) {
    console.error("Intel Failure:", error);
    return { 
      items: FALLBACK_INTEL.map(i => ({...i, date: "Offline"})), 
      source: "BACKUP" 
    };
  }
}

export default async function Page() {
  const { items, source } = await getWhoIntel();
  
  const lastSync = new Date().toLocaleString('en-GB', { 
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false 
  });

  return (
    <div className="bg-black min-h-screen">
      {DEBUG_MODE && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-900 text-white p-4 text-xs font-mono z-[100] max-h-40 overflow-auto">
          <strong>DEBUG MONITOR:</strong>
          <pre>{JSON.stringify(items[0], null, 2)}</pre>
        </div>
      )}
      <ClinicalDashboard 
        intelData={items} 
        source={source} 
        lastSync={lastSync}
      />
    </div>
  );
}
