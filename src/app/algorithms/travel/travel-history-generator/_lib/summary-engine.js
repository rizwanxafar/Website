import { parseDate, formatDMY, escapeHtml, cap } from './utils';

function exposureBullets(exp) {
  if (!exp) return { positives: [], negatives: [], otherText: '' };
  
  const positives = []; 
  const negatives = [];
  
  // detail text is now centralized in exp.positiveDetails
  const detailText = exp.positiveDetails?.trim() || '';

  const push = (label, key) => {
    let s = exp[key]; 
    if (typeof s === 'boolean') s = s ? 'yes' : 'unknown';
    if (s === 'yes') { 
        // We push the label, and attach the GLOBAL detail string to the first item only
        positives.push({ label: cap(label), details: positives.length === 0 ? detailText : '' }); 
    } else if (s === 'no') { 
        negatives.push(cap(label)); 
    }
  };

  push('mosquito bites', 'mosquito');
  push('tick bites', 'tick');
  
  if (exp.vectorOtherEnabled === 'yes' || exp.vectorOtherEnabled === true) {
     positives.push({ label: 'Other vector', details: positives.length === 0 ? detailText : '' });
  } else if (exp.vectorOtherEnabled === 'no') {
     negatives.push('Other vector');
  }

  push('swimming or wading in fresh water', 'freshwater');
  push('visited caves or mines', 'cavesMines');
  push('rural / forest stay', 'ruralForest');
  push('hiking in forest / bush / woodlands', 'hikingWoodlands');
  push('animal contact', 'animalContact');
  push('animal bite / scratch', 'animalBiteScratch');
  push('contact with bats or rodents', 'batsRodents');
  push('bushmeat consumption', 'bushmeat');
  push('needles / tattoos / piercings', 'needlesTattoos');
  push('safari / wildlife viewing', 'safariWildlife');
  push('street food', 'streetFood');
  push('drank untreated water', 'untreatedWater');
  push('undercooked food', 'undercookedFood');
  push('undercooked seafood', 'undercookedSeafood');
  push('unpasteurised milk', 'unpasteurisedMilk');
  push('attended funerals', 'funerals');
  push('close contact with unwell people (e.g., cough, fever)', 'sickContacts');
  push('healthcare facility contact', 'healthcareFacility');
  push('prison contact', 'prison');
  push('refugee camp contact', 'refugeeCamp');
  push('unprotected sex', 'unprotectedSex');
  
  return { positives, negatives, otherText: exp.otherText?.trim() || '' };
}

export function buildSummaryFromEvents(state, mergedEventsAllTrips) {
  const html = [];
  const text = [];
  const byTrip = new Map();
  (mergedEventsAllTrips || []).forEach((ev) => { if (!byTrip.has(ev.tripId)) byTrip.set(ev.tripId, []); byTrip.get(ev.tripId).push(ev); });
  const tripsCount = byTrip.size;

  let tripIndex = 1;
  for (const [tripId, events] of byTrip.entries()) {
    const stops = events.filter((e) => e.type === "stop").map((e) => e.stop);
    const arrivals = stops.map((s) => parseDate(s.arrival)).filter(Boolean);
    const departures = stops.map((s) => parseDate(s.departure)).filter(Boolean);
    const start = arrivals.length ? formatDMY(new Date(Math.min(...arrivals)).toISOString()) : "—";
    const end = departures.length ? formatDMY(new Date(Math.max(...departures)).toISOString()) : "—";
    const countriesList = []; const seen = new Set();
    stops.forEach((s) => { const c = (s.country || "").trim(); if (c && !seen.has(c)) { seen.add(c); countriesList.push(c); } });
    const countriesCsv = countriesList.join(", ") || "—";

    if (tripsCount === 1) { html.push(`<p><strong>Trip details:</strong></p>`); text.push(`Trip details:`); } else { html.push(`<p><strong>Trip ${tripIndex}</strong></p>`); text.push(`Trip ${tripIndex}`); }
    html.push(`<div>Dates: ${escapeHtml(`${start} to ${end}`)}</div>`); text.push(`Dates: ${start} to ${end}`);
    html.push(`<div>Country / countries travelled (See below for details of the countries in this trip): ${escapeHtml(countriesCsv)}</div>`); text.push(`Country / countries travelled (See below for details of the countries in this trip): ${countriesCsv}`);

    const tripObj = state.trips.find((t) => t.id === tripId) || {};
    { const fromCity = (tripObj.originCity || "").trim(); const fromCountry = (tripObj.originCountry || "").trim(); if (fromCity || fromCountry) { const fromLine = [fromCity, fromCountry].filter(Boolean).join(", "); html.push(`<div>Travelling from: ${escapeHtml(fromLine)}</div>`); text.push(`Travelling from: ${fromLine}`); } }
    if (tripObj.purpose && tripObj.purpose.trim()) { html.push(`<div>Purpose: ${escapeHtml(tripObj.purpose)}</div>`); text.push(`Purpose: ${tripObj.purpose}`); }

    { 
      const m = tripObj.malaria || { indication: "Not indicated", drug: "None", adherence: "" }; 
      let malariaText = "Not indicated";
      
      if (m.indication === "Unsure") {
        malariaText = "Unsure";
      } else if (m.indication === "Taken") {
        let txt = "Taken";
        if (m.drug && m.drug !== "None") {
           txt += ` — ${m.drug === 'Unknown' ? 'Unknown drug' : m.drug}`;
        }
        if (m.adherence) {
           txt += ` (Adherence: ${m.adherence})`;
        }
        malariaText = txt;
      } else if (m.indication === "Not taken") {
        malariaText = "Not taken";
      }
      
      html.push(`<div>Malaria prophylaxis: ${escapeHtml(malariaText)}</div>`); 
      text.push(`Malaria prophylaxis: ${malariaText}`); 
    }
    
    { 
      const v = tripObj.vaccines || { status: 'unknown', details: [] };
      let vaccineText = "None";
      if (v.status === 'Taken') {
        vaccineText = `Taken: ${v.details?.length ? v.details.join(', ') : 'No details provided'}`;
      } else if (v.status === 'Not taken') {
        vaccineText = 'Not taken';
      } else if (v.status === 'Unsure') {
        vaccineText = 'Unsure';
      }
      html.push(`<div>Pre-travel vaccinations: ${escapeHtml(vaccineText)}</div>`); 
      text.push(`Pre-travel vaccinations: ${vaccineText}`); 
    }

    { const cmp = tripObj.companions || {}; if (cmp.group === "Alone") { html.push(`<div>Travelled alone.</div>`); text.push(`Travelled alone.`); } else { const groupStr = cmp.group === "Other" ? cmp.otherText || "Other" : cmp.group || "—"; html.push(`<div>Travelled with: ${escapeHtml(groupStr)}</div>`); text.push(`Travelled with: ${groupStr}`); const wellStr = cmp.companionsWell === "yes" ? "Yes" : cmp.companionsWell === "no" ? "No" : "Unknown"; if (cmp.companionsWell === "no") { const details = (cmp.companionsUnwellDetails || "").trim(); html.push(`<div>Are they well: No${details ? ` — ${escapeHtml(details)}` : ""}</div>`); text.push(`Are they well: No${details ? ` — ${details}` : ""}`); } else { html.push(`<div>Are they well: ${wellStr}</div>`); text.push(`Are they well: ${wellStr}`); } } }

    events.forEach((ev) => {
      if (ev.type !== "stop") return;
      const s = ev.stop;
      const country = escapeHtml(s.country || "—");
      const countryDates = `${formatDMY(s.arrival) || "—"} to ${formatDMY(s.departure) || "—"}`;
      html.push(`<div style="height:8px"></div>`); text.push("");
      html.push(`<p><strong>${country} (${escapeHtml(countryDates)})</strong></p>`); text.push(`${s.country || "—"} (${countryDates})`);

      const citiesArr = (s.cities || []).map((c) => typeof c === "string" ? { name: c, arrival: "", departure: "" } : { name: c?.name || "", arrival: c?.arrival || "", departure: c?.departure || "" }).filter((c) => c.name);
      if (citiesArr.length) { html.push(`<div>Cities / regions:</div>`); text.push(`Cities / regions:`); text.push(""); html.push('<ul class="list-disc pl-5">'); citiesArr.forEach((cObj) => { const a = cObj.arrival ? formatDMY(cObj.arrival) : ""; const d = cObj.departure ? formatDMY(cObj.departure) : ""; const datePart = a || d ? ` (${a || "—"} to ${d || "—"})` : ""; const line = `${cObj.name}${datePart}`; html.push(`<li>${escapeHtml(line)}</li>`); text.push(`• ${line}`); }); html.push("</ul>"); text.push(""); } else { html.push(`<div>Cities / regions: —</div>`); text.push(`Cities / regions: —`); }

      const accom = s.accommodations?.length ? (s.accommodations.includes("Other") && s.accommodationOther ? [...s.accommodations.filter((a) => a !== "Other"), `Other: ${s.accommodationOther}`].join(", ") : s.accommodations.join(", ")) : "";
      if (accom) { html.push(`<div>Accommodation: ${escapeHtml(accom)}</div>`); text.push(`Accommodation: ${accom}`); } else { html.push(`<div>Accommodation: —</div>`); text.push(`Accommodation: —`); }

      const { positives, negatives, otherText } = exposureBullets(s.exposures);
      
      if (positives.length > 0) { 
        const labels = positives.map(p => p.label).join(", ");
        html.push(`<div><strong>Exposures:</strong> ${escapeHtml(labels)}</div>`); 
        text.push(`Exposures: ${labels}`);
        
        const narrative = positives[0]?.details; 
        if (narrative) {
           html.push(`<div><strong>Details:</strong> ${escapeHtml(narrative)}</div>`);
           text.push(`Details: ${narrative}`);
        }
      }
      
      if (negatives.length > 0) { 
        const line = `No exposures to: ${negatives.join(", ")}`;
        html.push(`<div>${escapeHtml(line)}</div>`); 
        text.push(line);
      }

      if (otherText) {
        html.push(`<div style="margin-top:4px"><strong>Other trip details:</strong></div>`);
        text.push(`Other trip details:`);
        html.push(`<div>${escapeHtml(otherText)}</div>`);
        text.push(otherText);
      }

      if (positives.length === 0 && negatives.length === 0 && !otherText) {
         html.push(`<div>Exposures: —</div>`);
         text.push(`Exposures: —`);
      }
    });

    const tripLayovers = events.filter(e => e.type === 'layover');
    if (tripLayovers.length > 0) {
      html.push(`<div style="height:12px"></div>`);
      html.push(`<p><strong>Transit / Layovers</strong></p>`);
      html.push('<ul class="list-disc pl-5">');
      
      text.push("");
      text.push("Transit / Layovers:");

      const fmtLayover = (l) => { 
        const place = `${(l.city ? `${l.city}, ` : "") + (l.country || "")}`.trim(); 
        const dates = `(${formatDMY(l.start) || "—"} to ${formatDMY(l.end) || "—"})`; 
        const act = l.leftAirport === "yes" && (l.activitiesText || "").trim() ? ` · ${l.activitiesText.trim()}` : ""; 
        const line = `${place} ${dates}${act}`; 
        return { html: escapeHtml(line), text: line }; 
      };

      tripLayovers.forEach(ev => {
        const { html: h, text: t } = fmtLayover(ev.layover);
        html.push(`<li>${h}</li>`);
        text.push(`- ${t}`);
      });
      html.push('</ul>');
    }

    tripIndex += 1;
  }

  if (state.pastTravels.length > 0) {
    html.push(`<div style="height:12px"></div>`);
    html.push(`<p><strong>Significant Past Travel</strong></p>`);
    html.push('<ul class="list-disc pl-5">');
    text.push("");
    text.push("Significant Past Travel");
    
    state.pastTravels.forEach(pt => {
      const line = `<strong>${escapeHtml(pt.country || "Unknown")}</strong> (${escapeHtml(pt.year || "—")}): ${escapeHtml(pt.details || "")}`;
      const txtLine = `${pt.country || "Unknown"} (${pt.year || "—"}): ${pt.details || ""}`;
      html.push(`<li>${line}</li>`);
      text.push(`• ${txtLine}`);
    });
    html.push('</ul>');
  }

  return { summaryHtml: html.join("\n"), summaryTextPlain: text.join("\n") };
}
