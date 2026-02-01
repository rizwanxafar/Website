import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { HCID_FALLBACK_MAP } from '@/data/hcidFallbackSnapshot';

// Revalidate every 24 hours
export const revalidate = 86400; 

const GOV_UK_URL = "https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk";

export async function GET() {
  try {
    console.log("⚡️ [ISR] Refreshing HCID data from GOV.UK...");
    
    const response = await fetch(GOV_UK_URL, {
      headers: {
        'User-Agent': 'ID-Northwest-Clinical-Tool/1.0 (Public Health Tool)',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch GOV.UK: ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const newData = {};

    // --- STRATEGY: TABLE-FIRST (The "Omni-Scraper") ---
    // Instead of looking for headers, we look for the Data Tables themselves.
    // This bypasses layout issues (Accordions, divs, paragraphs).
    
    $('table').each((i, table) => {
      const $table = $(table);
      
      // 1. Verify this is a Disease Table (Check headers)
      const headers = $table.find('thead th').map((_, th) => $(th).text().trim().toLowerCase()).get();
      const hasDiseaseCol = headers.some(h => h.includes('disease'));
      
      if (!hasDiseaseCol) return; // Skip random tables

      // 2. Find the Country Name (The "Owner" of this table)
      // We traverse up and prev to find the nearest H2 or H3.
      let countryName = "";

      // Strategy A: Preceding Sibling (Flat Layout)
      // Check previous siblings for a header
      const $prevHeader = $table.prevAll('h2, h3').first();
      if ($prevHeader.length) {
        countryName = $prevHeader.text().trim();
      } 
      // Strategy B: Accordion Parent (Nested Layout)
      // If table is inside an accordion content div, the header is in the sibling button
      else {
        const $section = $table.closest('.govuk-accordion__section');
        if ($section.length) {
          const $accordionHeader = $section.find('.govuk-accordion__section-header');
          // Text often includes "Show section", so we just get the clean text node or button text
          countryName = $accordionHeader.text().replace(/(Show|Hide) section/gi, '').trim();
        }
      }

      // 3. Extract Data
      if (countryName) {
        const diseases = [];
        $table.find('tbody tr').each((j, tr) => {
          const cells = $(tr).find('td');
          if (cells.length >= 2) {
            const name = $(cells[0]).text().trim();
            if (name) {
              diseases.push({
                disease: name,
                evidence: $(cells[1]).text().trim(),
                year: cells.length > 2 ? $(cells[2]).text().trim() : ''
              });
            }
          }
        });

        if (diseases.length > 0) {
          newData[countryName] = diseases;
        }
      }
    });

    // --- INTEGRITY CHECK ---
    const countryCount = Object.keys(newData).length;
    
    // Safety Net: If we found fewer than 20 countries, the scrape likely failed.
    if (countryCount < 20) {
      console.warn(`⚠️ [ISR] Integrity Check Failed: Only found ${countryCount} countries. Reverting to fallback.`);
      return NextResponse.json({ 
        source: 'fallback', 
        date: new Date().toISOString(), 
        data: HCID_FALLBACK_MAP 
      });
    }

    // Success!
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
