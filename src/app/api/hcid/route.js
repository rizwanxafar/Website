import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { HCID_FALLBACK_MAP } from '@/data/hcidFallbackSnapshot';

// Revalidate once every 24 hours
export const revalidate = 86400; 

const GOV_UK_URL = "https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk";

export async function GET() {
  try {
    console.log("⚡️ [ISR] Refreshing HCID data from GOV.UK...");
    
    const response = await fetch(GOV_UK_URL, {
      headers: {
        'User-Agent': 'ID-Northwest-Clinical-Tool/1.0 (Public Health Tool)'
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch GOV.UK: ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const newData = {};

    // --- ROBUST SCRAPER V2: THE HUNTER-SEEKER ---
    // Problem: GOV.UK often puts a <p> or <div> between the H2 and the Table.
    // Solution: Don't check .next(). Scan everything *until* the next header.
    
    $('h2, h3').each((i, el) => {
      const $header = $(el);
      const countryName = $header.text().trim();
      
      // Stop scanning when we hit the next H2, H3, or the end of the container
      // This creates a "Block" of content belonging to this country.
      const $contentBlock = $header.nextUntil('h2, h3');
      
      // Find the first table within this block
      const $table = $contentBlock.filter('table').first();

      if ($table.length) {
        const diseases = [];
        
        $table.find('tbody tr').each((j, tr) => {
          const cells = $(tr).find('td');
          // Some tables have 2 columns (Disease, Evidence), some have 3 (Year)
          if (cells.length >= 2) {
            const name = $(cells[0]).text().trim();
            // Filter out empty rows or header artifacts
            if (name) {
              diseases.push({
                disease: name,
                evidence: $(cells[1]).text().trim(),
                year: cells.length > 2 ? $(cells[2]).text().trim() : ''
              });
            }
          }
        });

        // Only add if we actually found data
        if (diseases.length > 0) {
          newData[countryName] = diseases;
        }
      }
    });

    // --- INTEGRITY CHECK ---
    // If the scrape missed most countries (e.g. layout changed drastically),
    // we must reject it to prevent overwriting the valid fallback.
    const countryCount = Object.keys(newData).length;
    
    if (countryCount < 20) {
      console.warn(`⚠️ [ISR] Integrity Check Failed: Only found ${countryCount} countries. Reverting to fallback.`);
      return NextResponse.json({ 
        source: 'fallback', 
        date: new Date().toISOString(), 
        data: HCID_FALLBACK_MAP 
      });
    }

    console.log(`✅ [ISR] Scrape Successful: Found ${countryCount} countries.`);
    
    return NextResponse.json({ 
      source: 'live', 
      date: new Date().toISOString(), 
      data: newData 
    });

  } catch (error) {
    console.error("❌ [ISR] Error fetching HCID data:", error);
    return NextResponse.json({ 
      source: 'fallback-error', 
      date: new Date().toISOString(), 
      data: HCID_FALLBACK_MAP 
    });
  }
}
