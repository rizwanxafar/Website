'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v27 (Final: Text Summary Sync Fix)
// Includes:
// - Malaria Segmented Control
// - Pro Date Picker (Desktop Popover / Mobile Native)
// - Significant Past Travel Section
// - Per-Trip Companions
// - Fixed Text Summary logic to match HTML exactly

import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { Combobox, Listbox, Popover, Transition } from '@headlessui/react';
import { clsx } from 'clsx'; 
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';

// ---- Data Sources ----
import { Country, City } from "country-state-city";

// --- Helpers ---
const CSC_COUNTRIES = Country.getAllCountries();

const normalize = (str) => 
  str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";

function getIsoFromCountryName(name) {
  if (!name) return "";
  const q = normalize(name.trim());
  let hit = CSC_COUNTRIES.find(c => normalize(c.name) === q);
  if (hit) return hit.isoCode;
  return "";
}

// ---- Options ----
const ACCOMMODATION_OPTIONS = [
  'Hotel/Resort', 'Hostel', 'Homestay', 'Friends/Family home', 'Rural camp', 'Safari camp',
  'Refugee camp', 'Healthcare facility residence', 'Other',
];

const VACCINE_OPTIONS = [
  'Yellow fever', 'Hepatitis A', 'Hepatitis B', 'Typhoid', 'Meningitis ACWY',
  'Rabies (pre-exposure)', 'Cholera (oral)', 'Japanese encephalitis (JE)',
  'Tick-borne encephalitis (TBE)', 'Other',
];

const MALARIA_DRUGS = ['None', 'Atovaquone/Proguanil', 'Doxycycline', 'Mefloquine', 'Chloroquine', 'Unknown'];
const MALARIA_STATUS_OPTIONS = ['Not indicated', 'Taken', 'Not taken', 'Unsure'];
const ADHERENCE_OPTIONS = ['Good', 'Partial', 'Poor', 'Unknown'];

const COMPANION_GROUPS = ['Alone', 'Family', 'Friends', 'Other'];
const COMPANION_WELL_OPTIONS = ['Yes', 'No', 'Unknown'];

// ---- Theme Classes ----
const BTN_BASE = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
const BTN_PRIMARY = clsx(BTN_BASE, "text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95 focus:ring-[hsl(var(--brand))]/70 disabled:opacity-50 disabled:cursor-not-allowed");
const BTN_SECONDARY = clsx(BTN_BASE, "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 focus:ring-slate-400");
const LINKISH_SECONDARY = "rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition text-slate-600 dark:text-slate-400";
const NODE_COLOR = "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))]";
const INPUT_BASE = "w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-slate-900 dark:text-slate-100 bg-transparent focus:ring-0";
const CONTAINER_BASE = "relative w-full cursor-default overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-left focus-within:border-[hsl(var(--brand))] focus-within:ring-1 focus-within:ring-[hsl(var(--brand))] sm:text-sm transition-all";
const TEXT_INPUT_CLASS = clsx(CONTAINER_BASE, "flex items-center");
const TEXTAREA_CLASS = "w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-[hsl(var(--brand))] transition";
const SECTION_HEADING = "text-lg font-semibold text-slate-900 dark:text-slate-100";

// ---- Icons ----
const Icons = {
  ChevronUpDown: (p) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-slate-400" {...p}><path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" /></svg>,
  Check: (p) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" {...p}><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>,
  Plus: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Calendar: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  ChevronLeft: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 18 6-6-6-6"/></svg>,
  Trash: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
};

// ---- Helpers ----
const uid = () => Math.random().toString(36).slice(2, 9);
const classNames = (...parts) => parts.filter(Boolean).join(' ');

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDMY = (dateStr) => {
  const d = parseDate(dateStr);
  if (!d) return '';
  return format(d, 'dd/MM/yyyy');
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  const aS = parseDate(aStart), aE = parseDate(aEnd), bS = parseDate(bStart), bE = parseDate(bEnd);
  if (!aS || !aE || !bS || !bE) return false;
  return aS < bE && bS < aE;
}

// ---- Custom UI Components ----
function ResponsiveDatePicker({ value, onChange }) {
  const dateObj = value ? parseDate(value) : undefined;
  const handleDaySelect = (d) => { if (!d) { onChange(''); return; } onChange(format(d, 'yyyy-MM-dd')); };
  return (
    <div className="relative mt-1">
      <div className="block md:hidden"><div className={CONTAINER_BASE}><input type="date" className={INPUT_BASE} value={value || ''} onChange={(e) => onChange(e.target.value)} /></div></div>
      <div className="hidden md:block">
        <Popover className="relative w-full">
          <Popover.Button className={clsx(CONTAINER_BASE, "flex items-center justify-between text-left")}>
            <span className={clsx("block truncate py-2 pl-3", !value && "text-slate-400")}>{value ? formatDMY(value) : "Select date"}</span>
            <span className="pr-3 text-slate-400"><Icons.Calendar className="w-4 h-4" /></span>
          </Popover.Button>
          <Transition as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
            <Popover.Panel className="absolute z-50 mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800">
              {({ close }) => (
                <DayPicker mode="single" selected={dateObj} onSelect={(d) => { handleDaySelect(d); close(); }} showOutsideDays classNames={{ months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0", month: "space-y-4", caption: "flex justify-center pt-1 relative items-center", caption_label: "text-sm font-medium text-slate-900 dark:text-slate-100", nav: "space-x-1 flex items-center", nav_button: "h-7 w-7 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md flex items-center justify-center text-slate-500 transition", nav_button_previous: "absolute left-1", nav_button_next: "absolute right-1", table: "w-full border-collapse space-y-1", head_row: "flex", head_cell: "text-slate-400 rounded-md w-9 font-normal text-[0.8rem]", row: "flex w-full mt-2", cell: "text-center text-sm relative p-0 focus-within:relative focus-within:z-20", day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100", day_selected: "!bg-[hsl(var(--brand))] !text-white hover:!bg-[hsl(var(--brand))]/90", day_today: "bg-slate-100 dark:bg-slate-800 font-bold text-[hsl(var(--brand))]" }} components={{ IconLeft: () => <Icons.ChevronLeft className="w-4 h-4" />, IconRight: () => <Icons.ChevronRight className="w-4 h-4" /> }} />
              )}
            </Popover.Panel>
          </Transition>
        </Popover>
      </div>
    </div>
  );
}

function SearchableSelect({ value, onChange, options, placeholder, allowCustom = false }) {
  const [query, setQuery] = useState('');
  const filteredOptions = useMemo(() => {
    const q = normalize(query);
    const fullList = query === '' ? options : options.filter((opt) => { const str = typeof opt === 'string' ? opt : opt.name; return normalize(str).includes(q); });
    return fullList.slice(0, 100);
  }, [query, options]);

  return (
    <Combobox value={value} onChange={onChange} nullable>
      <div className="relative mt-1">
        <div className={CONTAINER_BASE}>
          <Combobox.Input className={INPUT_BASE} displayValue={(item) => item || ''} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2"><Icons.ChevronUpDown aria-hidden="true" /></Combobox.Button>
        </div>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQuery('')}>
          <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-slate-900 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {filteredOptions.length === 0 && query !== '' ? (
              allowCustom ? (
                <Combobox.Option className={({ active }) => clsx('relative cursor-pointer select-none py-2 pl-4 pr-4', active ? 'bg-[hsl(var(--brand))] text-white' : 'text-slate-900 dark:text-slate-100')} value={query}>
                  <div className="flex items-center gap-2"><Icons.Plus className="h-4 w-4" /><span>Use "{query}"</span></div>
                </Combobox.Option>
              ) : (<div className="relative cursor-default select-none px-4 py-2 text-slate-500">Nothing found.</div>)
            ) : (
              filteredOptions.map((opt, idx) => {
                const label = typeof opt === 'string' ? opt : opt.name;
                const key = typeof opt === 'string' ? `${opt}-${idx}` : `${opt.name}-${opt.id || idx}`;
                return (
                  <Combobox.Option key={key} className={({ active }) => clsx('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-[hsl(var(--brand))] text-white' : 'text-slate-900 dark:text-slate-100')} value={label}>
                    {({ selected, active }) => (<><span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>{label}</span>{selected ? (<span className={clsx('absolute inset-y-0 left-0 flex items-center pl-3', active ? 'text-white' : 'text-[hsl(var(--brand))]')}><Icons.Check aria-hidden="true" /></span>) : null}</>)}
                  </Combobox.Option>
                );
              })
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}

function SimpleSelect({ value, onChange, options }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative mt-1">
        <Listbox.Button className={CONTAINER_BASE}>
          <span className="block truncate py-2 pl-3 pr-10 min-h-[36px]">{value}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><Icons.ChevronUpDown aria-hidden="true" /></span>
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-slate-900 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {options.map((opt, idx) => (
              <Listbox.Option key={idx} className={({ active }) => clsx('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-[hsl(var(--brand))] text-white' : 'text-slate-900 dark:text-slate-100')} value={opt}>
                {({ selected, active }) => (<><span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>{opt}</span>{selected ? (<span className={clsx('absolute inset-y-0 left-0 flex items-center pl-3', active ? 'text-white' : 'text-[hsl(var(--brand))]')}><Icons.Check aria-hidden="true" /></span>) : null}</>)}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

// ---- State ----
const emptyStop = () => ({
  id: uid(), country: '', cities: [{ name: '', arrival: '', departure: '' }], arrival: '', departure: '', accommodations: [], accommodationOther: '',
  exposures: { mosquito: 'unknown', mosquitoDetails: '', tick: 'unknown', tickDetails: '', vectorOtherEnabled: 'unknown', vectorOtherDetails: '', freshwater: 'unknown', freshwaterDetails: '', cavesMines: 'unknown', cavesMinesDetails: '', ruralForest: 'unknown', ruralForestDetails: '', hikingWoodlands: 'unknown', hikingWoodlandsDetails: '', animalContact: 'unknown', animalContactDetails: '', animalBiteScratch: 'unknown', animalBiteScratchDetails: '', bushmeat: 'unknown', bushmeatDetails: '', needlesTattoos: 'unknown', needlesTattoosDetails: '', safariWildlife: 'unknown', safariWildlifeDetails: '', streetFood: 'unknown', streetFoodDetails: '', untreatedWater: 'unknown', untreatedWaterDetails: '', undercookedFood: 'unknown', undercookedFoodDetails: '', undercookedSeafood: 'unknown', undercookedSeafoodDetails: '', unpasteurisedMilk: 'unknown', unpasteurisedMilkDetails: '', funerals: 'unknown', funeralsDetails: '', largeGatherings: 'unknown', largeGatheringsDetails: '', sickContacts: 'unknown', sickContactsDetails: '', healthcareFacility: 'unknown', healthcareFacilityDetails: '', prison: 'unknown', prisonDetails: '', refugeeCamp: 'unknown', refugeeCampDetails: '', unprotectedSex: 'unknown', unprotectedSexDetails: '', otherText: '' },
});
const emptyLayover = (tripId) => ({ id: uid(), tripId, country: '', city: '', start: '', end: '', leftAirport: 'no', activitiesText: '' });
const emptyPastTravel = () => ({ id: uid(), country: '', year: '', details: '' });
const emptyTrip = () => ({ id: uid(), purpose: '', originCountry: 'United Kingdom', originCity: 'Manchester', vaccines: [], vaccinesOther: '', malaria: { indication: 'Not indicated', drug: 'None', adherence: '' }, companions: { group: 'Alone', otherText: '', companionsWell: 'unknown', companionsUnwellDetails: '' }, stops: [emptyStop()], layovers: [] });
const initialState = { trips: [emptyTrip()], pastTravels: [] };

// ---- Builder ----
function buildTripEvents(trip, companions) {
  const stopsSorted = [...trip.stops].sort((a, b) => (parseDate(a.arrival) - parseDate(b.arrival)));
  const layoversSorted = [...trip.layovers].sort((a, b) => (parseDate(a.start) - parseDate(b.start)));
  const events = [];
  if (stopsSorted.length === 0) { layoversSorted.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l })); return events; }
  const firstStop = stopsSorted[0]; const lastStop = stopsSorted[stopsSorted.length - 1]; const beforeFirst = []; const afterLast = []; const betweenByIndex = Array.from({ length: Math.max(0, stopsSorted.length - 1) }, () => []);
  for (const l of layoversSorted) {
    const sTime = parseDate(l.start); const eTime = parseDate(l.end);
    if (eTime && eTime <= parseDate(firstStop.arrival)) { beforeFirst.push(l); continue; }
    if (sTime && sTime >= parseDate(lastStop.departure)) { afterLast.push(l); continue; }
    let placed = false;
    for (let i = 0; i < stopsSorted.length - 1; i++) { const depI = parseDate(stopsSorted[i].departure); const arrIp1 = parseDate(stopsSorted[i + 1].arrival); if (depI && arrIp1 && sTime && eTime && depI <= sTime && eTime <= arrIp1) { betweenByIndex[i].push(l); placed = true; break; } }
    if (!placed) { (sTime && sTime < parseDate(firstStop.arrival) ? beforeFirst : afterLast).push(l); }
  }
  const firstStopId = firstStop.id; const lastStopId = lastStop.id;
  beforeFirst.sort((a, b) => (parseDate(a.end) - parseDate(b.end)));
  afterLast.sort((a, b) => (parseDate(a.start) - parseDate(b.start)));
  stopsSorted.forEach((s, i) => {
    const isFirstInTrip = s.id === firstStopId; const isLastInTrip = s.id === lastStopId;
    events.push({ type: 'stop', date: parseDate(s.arrival), stop: { ...s, isFirstInTrip, isLastInTrip, tripPurpose: trip.purpose, tripVaccines: trip.vaccines || [], tripVaccinesOther: trip.vaccinesOther || '', tripMalaria: trip.malaria || { indication: 'Not indicated', drug: 'None', adherence: '' }, tripCompanions: companions || null, tripOriginCountry: trip.originCountry || '', tripOriginCity: trip.originCity || '' } });
    if (i === 0 && beforeFirst.length) { beforeFirst.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l, anchorStopId: s.id, position: 'before-stop' })); }
    if (i < betweenByIndex.length) { const group = betweenByIndex[i].sort((a, b) => (parseDate(a.start) - parseDate(b.start))); group.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l, anchorStopId: s.id, position: 'between' })); }
    if (isLastInTrip && afterLast.length) { afterLast.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l, anchorStopId: s.id, position: 'after-stop' })); }
  });
  return events;
}

// ==== SUMMARY BUILDER (SYNC FIX) ====
function buildSummaryFromEvents(state, mergedEventsAllTrips) {
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

    // --- MALARIA SUMMARY (SYNCED) ---
    { 
      const m = tripObj.malaria || { indication: "Not indicated", drug: "None", adherence: "" }; 
      let malariaResult = "Not indicated";
      
      if (m.indication === "Unsure") {
        malariaResult = "Unsure";
      } else if (m.indication === "Taken") {
        let txt = "Taken";
        // Check for Unknown explicitly
        if (m.drug && m.drug !== "None") {
           txt += ` — ${m.drug === 'Unknown' ? 'Unknown drug' : m.drug}`;
        }
        if (m.adherence) {
           txt += ` (Adherence: ${m.adherence})`;
        }
        malariaResult = txt;
      } else if (m.indication === "Not taken") {
        malariaResult = "Not taken";
      }
      
      html.push(`<div>Malaria prophylaxis: ${escapeHtml(malariaResult)}</div>`); 
      text.push(`Malaria prophylaxis: ${malariaResult}`); 
    }
    
    { const vaccinesArr = Array.isArray(tripObj.vaccines) ? tripObj.vaccines : []; const hasOther = vaccinesArr.includes("Other"); const baseList = hasOther ? vaccinesArr.filter((v) => v !== "Other") : vaccinesArr; let vaccinesDisplay = baseList.join(", "); const otherText = (tripObj.vaccinesOther || "").trim(); if (hasOther && otherText) { vaccinesDisplay = vaccinesDisplay ? `${vaccinesDisplay}, Other: ${otherText}` : `Other: ${otherText}`; } else if (hasOther) { vaccinesDisplay = vaccinesDisplay ? `${vaccinesDisplay}, Other` : "Other"; } html.push(`<div>Pre-travel vaccinations: ${vaccinesDisplay ? escapeHtml(vaccinesDisplay) : "None"}</div>`); text.push(`Pre-travel vaccinations: ${vaccinesDisplay || "None"}`); }

    { const cmp = tripObj.companions || {}; if (cmp.group === "Alone") { html.push(`<div>Travelled alone.</div>`); text.push(`Travelled alone.`); } else { const groupStr = cmp.group === "Other" ? cmp.otherText || "Other" : cmp.group || "—"; html.push(`<div>Travelled with: ${escapeHtml(groupStr)}</div>`); text.push(`Travelled with: ${groupStr}`); const wellStr = cmp.companionsWell === "yes" ? "Yes" : cmp.companionsWell === "no" ? "No" : "Unknown"; if (cmp.companionsWell === "no") { const details = (cmp.companionsUnwellDetails || "").trim(); html.push(`<div>Are they well: No${details ? ` — ${escapeHtml(details)}` : ""}</div>`); text.push(`Are they well: No${details ? ` — ${details}` : ""}`); } else { html.push(`<div>Are they well: ${wellStr}</div>`); text.push(`Are they well: ${wellStr}`); } } }

    const layoversByStop = new Map();
    events.filter((e) => e.type === "layover" && e.anchorStopId).forEach((e) => { const sid = e.anchorStopId; if (!layoversByStop.has(sid)) layoversByStop.set(sid, { before: [], between: [], after: [] }); const bucket = e.position === "before-stop" ? "before" : e.position === "after-stop" ? "after" : "between"; layoversByStop.get(sid)[bucket].push(e.layover); });

    const fmtLayover = (l) => { const place = `${(l.city ? `${l.city}, ` : "") + (l.country || "")}`.trim(); const dates = `(${formatDMY(l.start) || "—"}–${formatDMY(l.end) || "—"})`; const act = l.leftAirport === "yes" && (l.activitiesText || "").trim() ? ` · ${l.activitiesText.trim()}` : ""; const line = `${place} ${dates}${act}`; return { html: escapeHtml(line), text: line }; };

    events.forEach((ev, idxInTrip) => {
      if (ev.type !== "stop") return;
      const s = ev.stop;
      const isLastStop = !!s.isLastInTrip;
      const country = escapeHtml(s.country || "—");
      const countryDates = `${formatDMY(s.arrival) || "—"} to ${formatDMY(s.departure) || "—"}`;
      html.push(`<div style="height:8px"></div>`); text.push("");
      html.push(`<p><strong>${country} (${escapeHtml(countryDates)})</strong></p>`); text.push(`${s.country || "—"} (${countryDates})`);

      const beforeList = (layoversByStop.get(s.id)?.before || []).map(fmtLayover);
      if (beforeList.length) { html.push(`<div>Layovers before this country:</div>`); text.push(`Layovers before this country:`); html.push(`<ul>${beforeList.map((v) => `<li>${v.html}</li>`).join("")}</ul>`); beforeList.forEach((v) => text.push(`- ${v.text}`)); }

      const citiesArr = (s.cities || []).map((c) => typeof c === "string" ? { name: c, arrival: "", departure: "" } : { name: c?.name || "", arrival: c?.arrival || "", departure: c?.departure || "" }).filter((c) => c.name);
      if (citiesArr.length) { html.push(`<div>Cities / regions:</div>`); text.push(`Cities / regions:`); text.push(""); html.push('<ul class="list-disc pl-5">'); citiesArr.forEach((cObj) => { const a = cObj.arrival ? formatDMY(cObj.arrival) : ""; const d = cObj.departure ? formatDMY(cObj.departure) : ""; const datePart = a || d ? ` (${a || "—"} to ${d || "—"})` : ""; const line = `${cObj.name}${datePart}`; html.push(`<li>${escapeHtml(line)}</li>`); text.push(`• ${line}`); }); html.push("</ul>"); text.push(""); } else { html.push(`<div>Cities / regions: —</div>`); text.push(`Cities / regions: —`); }

      const accom = s.accommodations?.length ? (s.accommodations.includes("Other") && s.accommodationOther ? [...s.accommodations.filter((a) => a !== "Other"), `Other: ${s.accommodationOther}`].join(", ") : s.accommodations.join(", ")) : "";
      if (accom) { html.push(`<div>Accommodation: ${escapeHtml(accom)}</div>`); text.push(`Accommodation: ${accom}`); } else { html.push(`<div>Accommodation: —</div>`); text.push(`Accommodation: —`); }

      const { positives, negatives } = exposureBullets(s.exposures);
      if (positives.length > 0 || negatives.length > 0) {
        if (positives.length > 0) { html.push(`<div>Exposures:</div>`); text.push(`Exposures:`); text.push(""); html.push('<ul class="list-disc pl-5">'); positives.forEach(({ label, details }) => { const line = details ? `${label} — ${details}` : label; html.push(`<li>${escapeHtml(line)}</li>`); text.push(`• ${line}`); }); html.push("</ul>"); text.push(""); }
        if (negatives.length > 0) { html.push(`<div>No exposures to:</div>`); text.push(`No exposures to:`); text.push(""); html.push('<ul class="list-disc pl-5">'); negatives.forEach((label) => { html.push(`<li>${escapeHtml(label)}</li>`); text.push(`• ${label}`); }); html.push("</ul>"); text.push(""); }
      } else { html.push(`<div>Exposures: —</div>`); text.push(`Exposures: —`); }

      const betweenList = (layoversByStop.get(s.id)?.between || []).map(fmtLayover);
      if (betweenList.length) { html.push(`<div>Layovers to next destination:</div>`); text.push(`Layovers to next destination:`); html.push(`<ul>${betweenList.map((v) => `<li>${v.html}</li>`).join("")}</ul>`); betweenList.forEach((v) => text.push(`- ${v.text}`)); }

      if (isLastStop) {
        const afterList = (layoversByStop.get(s.id)?.after || []).map(fmtLayover);
        if (afterList.length) { html.push(`<div>Layovers after this trip:</div>`); text.push(`Layovers after this trip:`); html.push(`<ul>${afterList.map((v) => `<li>${v.html}</li>`).join("")}</ul>`); afterList.forEach((v) => text.push(`- ${v.text}`)); }
      }
    });
    tripIndex += 1;
  }

  // --- APPEND PAST TRAVELS (FIXED: SYNCED) ---
  if (state.pastTravels.length > 0) {
    html.push(`<div style="height:12px"></div>`);
    html.push(`<p><strong>Significant Past Travel</strong></p>`);
    html.push('<ul class="list-disc pl-5">');
    text.push("");
    text.push("Significant Past Travel");
    
    state.pastTravels.forEach(pt => {
      const lineHtml = `<strong>${escapeHtml(pt.country || "Unknown")}</strong> (${escapeHtml(pt.year || "—")}): ${escapeHtml(pt.details || "")}`;
      const lineText = `${pt.country || "Unknown"} (${pt.year || "—"}): ${pt.details || ""}`;
      
      html.push(`<li>${lineHtml}</li>`);
      text.push(`• ${lineText}`);
    });
    html.push('</ul>');
  }

  return { summaryHtml: html.join("\n"), summaryTextPlain: text.join("\n") };
}

function escapeHtml(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function exposureBullets(exp) {
  if (!exp) return { positives: [], negatives: [] };
  const positives = []; const negatives = [];
  const push = (label, status, details) => {
    let s = status; if (typeof s === 'boolean') s = s ? 'yes' : 'unknown';
    if (s === 'yes') { positives.push({ label: cap(label), details: details?.trim() || '' }); } else if (s === 'no') { negatives.push(cap(label)); }
  };
  push('mosquito bites', exp.mosquito, exp.mosquitoDetails);
  push('tick bites', exp.tick, exp.tickDetails);
  if (exp.vectorOtherEnabled === 'yes') { positives.push({ label: 'Other vector', details: exp.vectorOtherDetails?.trim() || '' }); } else if (exp.vectorOtherEnabled === 'no') { negatives.push('Other vector'); }
  push('freshwater contact', exp.freshwater, exp.freshwaterDetails);
  push('visited caves or mines', exp.cavesMines, exp.cavesMinesDetails);
  push('rural / forest stay', exp.ruralForest, exp.ruralForestDetails);
  push('hiking in forest / bush / woodlands', exp.hikingWoodlands, exp.hikingWoodlandsDetails);
  push('animal contact', exp.animalContact, exp.animalContactDetails);
  push('animal bite / scratch', exp.animalBiteScratch, exp.animalBiteScratchDetails);
  push('bushmeat consumption', exp.bushmeat, exp.bushmeatDetails);
  push('needles / tattoos / piercings', exp.needlesTattoos, exp.needlesTattoosDetails);
  push('safari / wildlife viewing', exp.safariWildlife, exp.safariWildlifeDetails);
  push('street food', exp.streetFood, exp.streetFoodDetails);
  push('untreated water', exp.untreatedWater, exp.untreatedWaterDetails);
  push('undercooked food', exp.undercookedFood, exp.undercookedFoodDetails);
  push('undercooked seafood', exp.undercookedSeafood, exp.undercookedSeafoodDetails);
  push('unpasteurised milk', exp.unpasteurisedMilk, exp.unpasteurisedMilkDetails);
  push('attended funerals', exp.funerals, exp.funeralsDetails);
  push('sick contacts (including TB)', exp.sickContacts, exp.sickContactsDetails);
  push('healthcare facility contact', exp.healthcareFacility, exp.healthcareFacilityDetails);
  push('prison contact', exp.prison, exp.prisonDetails);
  push('refugee camp contact', exp.refugeeCamp, exp.refugeeCampDetails);
  push('unprotected sex', exp.unprotectedSex, exp.unprotectedSexDetails);
  if (exp.otherText?.trim()) { positives.push({ label: exp.otherText.trim(), details: '' }); }
  return { positives, negatives };
}
