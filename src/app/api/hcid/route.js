import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { HCID_FALLBACK_MAP } from '@/data/hcidFallbackSnapshot';

// 1. REVALIDATION: Run once every 24 hours
export const revalidate = 86400; 

const GOV_UK_URL = "https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk";

export async function GET() {
  let debugLog = []; 
  
  try {
    const log = (msg) => {
      console.log(msg);
      debugLog.push(msg);
    };

    log("⚡️ [ISR 24h] Starting Fill-Down Scrape...");

    // 2. STEALTH FETCH: Bypass basic WAFs
    const response = await fetch(GOV_UK_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache', 
      }
    });

    if (!response.ok) {
      throw new Error(`GOV.UK refused connection: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const newData = {};
    let totalDiseasesFound = 0;

    // --- STRATEGY: THE FILL-DOWN SCAPER ---
    // We search for ALL tables, assuming they might be inside accordions or divs.
    
    $('table').each((tableIndex, table) => {
      const $table = $(table);
      let currentCountry = null; // Reset for each new table

      // Iterate over every row in the body
      $table.find('tbody tr').each((rowIndex, tr) => {
        const cells = $(tr).find('td');
        
        // We need at least 2 columns (Country, Disease) to be useful
        if (cells.length >= 2) {
          const col0 = $(cells[0]).text().trim(); // Country
          const col1 = $(cells[1]).text().trim(); // Disease
          const col2 = cells.length > 2 ? $(cells[2]).text().trim() : ""; // Evidence
          const col3 = cells.length > 3 ? $(cells[3]).text().trim() : ""; // Year (Sometimes Col 2 is year, logic handles flexible columns below)

          // 1. FILL-DOWN LOGIC
          // If Col 0 has text, it's a new country (e.g. "Afghanistan")
          // If Col 0 is empty, it belongs to the previous country (e.g. "Plague" row)
          if (col0) {
            // Ignore headers if they got into tbody
            if (col0.toLowerCase() !== "country") {
              currentCountry = col0;
            }
          }

          // 2. DATA EXTRACTION
          // Only proceed if we have a valid country context and a disease listed
          if (currentCountry && col1) {
            
            // Normalize disease/evidence structure
            // Some tables are: [Country, Disease, Evidence, Year]
            // Some might be:   [Country, Disease, Year]
            // We assume standard: Col 1 is Disease.
            
            if (!newData[currentCountry]) {
              newData[currentCountry] = [];
            }

            newData[currentCountry].push({
              disease: col1,
              evidence: col2, // Usually Evidence
              year: col3      // Usually Year
            });

            totalDiseasesFound++;
          }
        }
      });
    });

    // --- INTEGRITY CHECK ---
    const countryCount = Object.keys(newData).length;
    log(`📊 Final Count: Found ${countryCount} countries and ${totalDiseasesFound} disease entries.`);
    
    // Safety Net: Raise the bar. We expect ~100+ countries globally.
    // If we find less than 10, the "Fill-Down" logic likely failed (e.g. columns moved).
    if (countryCount < 10) {
      log("❌ Integrity Check Failed. Reverting to fallback.");
      return NextResponse.json({ 
        source: 'fallback-integrity-fail', 
        date: new Date().toISOString(), 
        data: HCID_FALLBACK_MAP,
        debug: debugLog
      });
    }

    // Success!
    return NextResponse.json({ 
      source: 'live', 
      date: new Date().toISOString(), 
      data: newData,
      debug: debugLog
    });

  } catch (error) {
    console.error("❌ Error fetching HCID data:", error);
    debugLog.push(`Error: ${error.message}`);
    
    return NextResponse.json({ 
      source: 'fallback-error', 
      date: new Date().toISOString(), 
      data: HCID_FALLBACK_MAP,
      debug: debugLog
    });
  }
}
