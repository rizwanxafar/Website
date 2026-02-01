import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { HCID_FALLBACK_MAP } from '@/data/hcidFallbackSnapshot'; // Keep fallback ready

// 1. Set Revalidation to 24 hours (86400 seconds)
// Vercel will cache this response and only re-run the logic once per day.
export const revalidate = 86400; 

const GOV_UK_URL = "https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk";

export async function GET() {
  try {
    console.log("⚡️ [ISR] Refreshing HCID data from GOV.UK...");
    
    // 2. Fetch the live HTML
    const response = await fetch(GOV_UK_URL, {
      headers: {
        'User-Agent': 'ID-Northwest-Clinical-Tool/1.0 (Public Health Tool)'
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch GOV.UK: ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const newData = {};

    // 3. Scrape Logic
    // GOV.UK structure usually pairs an H2/H3 (Country Name) with a Table immediately following it.
    // We iterate through headers to find countries.
    
    // Note: Adjust selector based on actual page structure. 
    // Usually countries are H2 or H3 IDs, or text within specific sections.
    // This is a robust generic scraper for GOV.UK definition lists or tables.
    
    $('h2, h3').each((i, el) => {
      const countryName = $(el).text().trim();
      
      // Basic validation to ensure it's likely a country header (and not "Cookies" or "Contact")
      // You might want to validate against a known list of countries if this is too loose.
      const nextElem = $(el).next();
      
      if (nextElem.is('table')) {
        const diseases = [];
        
        // Iterate table rows
        nextElem.find('tbody tr').each((j, tr) => {
          const cells = $(tr).find('td');
          if (cells.length >= 3) {
            diseases.push({
              disease: $(cells[0]).text().trim(),
              evidence: $(cells[1]).text().trim(),
              year: $(cells[2]).text().trim()
            });
          }
        });

        if (diseases.length > 0) {
          newData[countryName] = diseases;
        }
      }
    });

    // 4. Validation / Safety Net
    // If the scrape failed completely (e.g. GOV.UK changed layout), return fallback
    if (Object.keys(newData).length < 5) {
      console.warn("⚠️ [ISR] Scrape yielded too few results. Reverting to fallback.");
      return NextResponse.json({ 
        source: 'fallback', 
        date: new Date().toISOString(), 
        data: HCID_FALLBACK_MAP 
      });
    }

    // 5. Success
    return NextResponse.json({ 
      source: 'live', 
      date: new Date().toISOString(), 
      data: newData 
    });

  } catch (error) {
    console.error("❌ [ISR] Error fetching HCID data:", error);
    // Fail gracefully to fallback
    return NextResponse.json({ 
      source: 'fallback-error', 
      date: new Date().toISOString(), 
      data: HCID_FALLBACK_MAP 
    });
  }
}
