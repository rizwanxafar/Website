import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { HCID_FALLBACK_MAP } from '@/data/hcidFallbackSnapshot';

// 1. REVALIDATION: Run this once every 24 hours (86400 seconds)
// This respects your wish to stay within Vercel free limits.
export const revalidate = 86400; 

const GOV_UK_URL = "https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk";

export async function GET() {
  let debugLog = []; // We will capture logs to send to the frontend if needed
  
  try {
    const log = (msg) => {
      console.log(msg);
      debugLog.push(msg);
    };

    log("⚡️ [ISR 24h] Starting Stealth Scrape...");

    // 2. STEALTH FETCH: Mimic a real browser to avoid WAF blocks (403 Forbidden)
    const response = await fetch(GOV_UK_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache', // Force the fetch to go to the live site, not Vercel's data cache
      }
    });

    if (!response.ok) {
      throw new Error(`GOV.UK refused connection: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const newData = {};

    log(`📄 Page Title: ${$('title').text()}`);

    // --- STRATEGY A: THE ACCORDION RIPPER ---
    // GOV.UK puts data inside <div class="govuk-accordion__section">
    const $accordions = $('.govuk-accordion__section');
    log(`🔎 Found ${$accordions.length} accordion sections.`);

    if ($accordions.length > 0) {
      $accordions.each((i, el) => {
        const $section = $(el);
        // The country name is on the button
        const rawName = $section.find('.govuk-accordion__section-button').text().trim();
        const countryName = rawName.replace(/Show section|Hide section/gi, '').trim();

        if (countryName) {
          // The table is inside the content div
          const $table = $section.find('.govuk-accordion__section-content table');
          const diseases = extractDiseases($, $table);
          if (diseases.length > 0) {
            newData[countryName] = diseases;
          }
        }
      });
    }

    // --- STRATEGY B: THE HUNTER-SEEKER (FALLBACK) ---
    // If Strategy A failed (no accordions found), assume a flat layout.
    if (Object.keys(newData).length === 0) {
      log("⚠️ No accordion data found. Switching to Hunter-Seeker mode...");
      
      $('h2, h3').each((i, el) => {
        const $header = $(el);
        const countryName = $header.text().trim();
        
        // Look ahead until the next header
        const $contentBlock = $header.nextUntil('h2, h3');
        const $table = $contentBlock.filter('table').first();
        
        // Also check if the table is nested inside a div immediately following
        const $nestedTable = $contentBlock.find('table').first();
        
        const $targetTable = $table.length ? $table : $nestedTable;

        if ($targetTable.length) {
           const diseases = extractDiseases($, $targetTable);
           if (diseases.length > 0) {
             newData[countryName] = diseases;
           }
        }
      });
    }

    // --- INTEGRITY CHECK ---
    const countryCount = Object.keys(newData).length;
    log(`📊 Final Count: Found ${countryCount} countries.`);
    
    // Safety Net: If we found fewer than 10 countries, the scrape failed.
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

// Helper to parse table rows
function extractDiseases($, $table) {
  const diseases = [];
  $table.find('tbody tr').each((j, tr) => {
    const cells = $(tr).find('td');
    if (cells.length >= 2) {
      const name = $(cells[0]).text().trim();
      // Ignore empty rows or "No known HCIDs" lines if you prefer
      if (name) {
        diseases.push({
          disease: name,
          evidence: $(cells[1]).text().trim(),
          year: cells.length > 2 ? $(cells[2]).text().trim() : ''
        });
      }
    }
  });
  return diseases;
}
