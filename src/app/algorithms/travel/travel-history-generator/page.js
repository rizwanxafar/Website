'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v43 (Geospatial Map Report)
// Changes:
// - FEAT: Replaced Gantt with Leaflet Map ("Street Map" style).
// - LOGIC: Auto-geocoding using Country-State-City data.
// - UI: Permanent tooltips on map for PDF clarity.

import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { 
  Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption,
  Listbox, ListboxButton, ListboxOptions, ListboxOption,
  Popover, PopoverButton, PopoverPanel,
  Transition, Dialog, DialogPanel, TransitionChild 
} from '@headlessui/react';
import { clsx } from 'clsx'; 
import { DayPicker } from 'react-day-picker';
import { format, differenceInDays, addDays, min, max, isValid, parseISO } from 'date-fns';

// ---- Map Dependencies ----
import 'leaflet/dist/leaflet.css'; // Ensure CSS is loaded
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React/Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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

function getCoordsFromCountryName(name) {
  if (!name) return null;
  const q = normalize(name.trim());
  let hit = CSC_COUNTRIES.find(c => normalize(c.name) === q);
  if (hit && hit.latitude && hit.longitude) {
    return [parseFloat(hit.latitude), parseFloat(hit.longitude)];
  }
  return null;
}

// ---- Options ----
const ACCOMMODATION_OPTIONS = [
  'Hotel/Resort', 'Hostel', 'Homestay', 'Friends/Family home', 'Rural camp', 'Safari camp',
  'Refugee camp', 'Healthcare facility residence', 'Other',
];

const VACCINE_SUGGESTIONS = [
  'Yellow fever', 'Hepatitis A', 'Hepatitis B', 'Typhoid', 'Meningitis ACWY',
  'Rabies', 'Cholera', 'Japanese encephalitis', 'Tick-borne encephalitis', 'Polio booster', 'Tetanus booster'
];

const MALARIA_DRUGS = ['None', 'Atovaquone/Proguanil', 'Doxycycline', 'Mefloquine', 'Chloroquine', 'Unknown'];
const MALARIA_STATUS_OPTIONS = ['Not indicated', 'Taken', 'Not taken', 'Unsure'];
const VACCINE_STATUS_OPTIONS = ['Taken', 'Not taken', 'Unsure']; 
const ADHERENCE_OPTIONS = ['Good', 'Partial', 'Poor', 'Unknown'];

const COMPANION_GROUPS = ['Alone', 'Family', 'Friends', 'Other'];
const COMPANION_WELL_OPTIONS = ['Yes', 'No', 'Unknown'];

// Exposure Categories
const EXPOSURE_CATEGORIES = [
  {
    title: "Vector-borne",
    items: [
      { key: 'mosquito', label: 'Mosquito bites' },
      { key: 'tick', label: 'Tick bites' },
      { key: 'vectorOtherEnabled', label: 'Other vector' }
    ]
  },
  {
    title: "Water / Environment",
    items: [
      { key: 'freshwater', label: 'Swimming or wading in fresh water' },
      { key: 'cavesMines', label: 'Visited caves or mines' },
      { key: 'ruralForest', label: 'Rural / forest stay' },
      { key: 'hikingWoodlands', label: 'Hiking in forest/woodlands' }
    ]
  },
  {
    title: "Animal & Procedures",
    items: [
      { key: 'animalContact', label: 'Animal contact' },
      { key: 'animalBiteScratch', label: 'Animal bite / scratch' },
      { key: 'batsRodents', label: 'Contact with bats or rodents' },
      { key: 'bushmeat', label: 'Bushmeat consumption' },
      { key: 'needlesTattoos', label: 'Needles / tattoos / piercings' },
      { key: 'safariWildlife', label: 'Safari / wildlife viewing' }
    ]
  },
  {
    title: "Food & Water",
    items: [
      { key: 'streetFood', label: 'Street food' },
      { key: 'untreatedWater', label: 'Drank untreated water' },
      { key: 'undercookedFood', label: 'Undercooked food' },
      { key: 'undercookedSeafood', label: 'Undercooked seafood' },
      { key: 'unpasteurisedMilk', label: 'Unpasteurised milk' }
    ]
  },
  {
    title: "Institutional / Social",
    items: [
      { key: 'funerals', label: 'Attended funerals' },
      { key: 'sickContacts', label: 'Close contact with unwell people (e.g., cough, fever)' },
      { key: 'healthcareFacility', label: 'Healthcare facility contact' },
      { key: 'prison', label: 'Prison contact' },
      { key: 'refugeeCamp', label: 'Refugee camp contact' },
      { key: 'unprotectedSex', label: 'Unprotected sex' }
    ]
  }
];

// ---- Theme Classes (Standardized) ----
const BTN_BASE = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";

const BTN_PRIMARY = clsx(BTN_BASE, 
  "text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95 focus:ring-[hsl(var(--brand))]/70 disabled:opacity-50 disabled:cursor-not-allowed"
);

const BTN_SECONDARY = clsx(BTN_BASE,
  "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 focus:ring-slate-400"
);

const LINKISH_SECONDARY =
  "rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition text-slate-600 dark:text-slate-400";

const INPUT_BASE = 
  "w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-slate-900 dark:text-slate-100 bg-transparent focus:ring-0";

const CONTAINER_BASE =
  "relative w-full cursor-default overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-left focus-within:border-[hsl(var(--brand))] focus-within:ring-1 focus-within:ring-[hsl(var(--brand))] sm:text-sm transition-all";

const TEXT_INPUT_CLASS = clsx(CONTAINER_BASE, "flex items-center");

const TEXTAREA_CLASS = 
  "w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-[hsl(var(--brand))] transition";

const SECTION_HEADING = "text-lg font-semibold text-slate-900 dark:text-slate-100";

// ---- Icons ----
const Icons = {
  ChevronUpDown: (p) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-slate-400" {...p}><path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" /></svg>,
  Check: (p) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" {...p}><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>,
  Plus: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Calendar: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  ChevronLeft: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 18 6-6-6-6"/></svg>,
  Trash: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Alert: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  X: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Printer: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>
};

// ---- Helpers ----
const uid = () => Math.random().toString(36).slice(2, 9);
const classNames = (...parts) => parts.filter(Boolean).join(' ');

// Internal date helper for logic
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Format outputs as DD/MM/YYYY
const formatDMY = (dateStr) => {
  const d = parseDate(dateStr);
  if (!d) return '';
  return format(d, 'dd/MM/yyyy');
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// ===== Shared chronology builder =====
function buildTripEvents(trip, companions) {
  const stopsSorted = [...trip.stops].sort((a, b) => (parseDate(a.arrival) - parseDate(b.arrival)));
  const layoversSorted = [...trip.layovers].sort((a, b) => (parseDate(a.start) - parseDate(b.start)));
  const events = [];

  if (stopsSorted.length === 0) {
    layoversSorted.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l }));
    return events;
  }

  const firstStop = stopsSorted[0];
  const lastStop = stopsSorted[stopsSorted.length - 1];
  const beforeFirst = [];
  const afterLast = [];
  const betweenByIndex = Array.from({ length: Math.max(0, stopsSorted.length - 1) }, () => []);

  for (const l of layoversSorted) {
    const sTime = parseDate(l.start);
    const eTime = parseDate(l.end);
    if (eTime && eTime <= parseDate(firstStop.arrival)) { beforeFirst.push(l); continue; }
    if (sTime && sTime >= parseDate(lastStop.departure)) { afterLast.push(l); continue; }
    let placed = false;
    for (let i = 0; i < stopsSorted.length - 1; i++) {
      const depI = parseDate(stopsSorted[i].departure);
      const arrIp1 = parseDate(stopsSorted[i + 1].arrival);
      if (depI && arrIp1 && sTime && eTime && depI <= sTime && eTime <= arrIp1) {
        betweenByIndex[i].push(l); placed = true; break;
      }
    }
    if (!placed) { (sTime && sTime < parseDate(firstStop.arrival) ? beforeFirst : afterLast).push(l); }
  }

  const firstStopId = firstStop.id;
  const lastStopId = lastStop.id;
  beforeFirst.sort((a, b) => (parseDate(a.end) - parseDate(b.end)));
  afterLast.sort((a, b) => (parseDate(a.start) - parseDate(b.start)));

  stopsSorted.forEach((s, i) => {
    const isFirstInTrip = s.id === firstStopId;
    const isLastInTrip = s.id === lastStopId;
    events.push({
      type: 'stop',
      date: parseDate(s.arrival),
      stop: {
        ...s, isFirstInTrip, isLastInTrip,
        tripPurpose: trip.purpose,
        tripVaccines: trip.vaccines || { status: 'unknown', details: [] },
        tripMalaria: trip.malaria || { indication: 'Not indicated', drug: 'None', adherence: '' },
        tripCompanions: companions || null,
        tripOriginCountry: trip.originCountry || '', tripOriginCity: trip.originCity || '',
      },
    });
    // Add layovers as events...
  });
  return events;
}

// ===== Main Page Component =====
export default function TravelHistoryGeneratorPage() {
  const [state, setState] = useState(initialState);
  const [issues, setIssues] = useState([]);
  const [highlight, setHighlight] = useState({ stopIds: new Set(), layoverIds: new Set() });
  const [pendingScrollId, setPendingScrollId] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  
  const itemRefs = useRef(new Map());
  const setItemRef = (id) => (el) => { if (el) itemRefs.current.set(id, el); };

  // ... (Keep existing effects for unload, issues, scroll) ...

  // Re-build merged events
  const mergedEventsAllTrips = useMemo(() => {
    const merged = [];
    state.trips.forEach((trip) => {
      buildTripEvents(trip, trip.companions).forEach((ev) => merged.push({ ...ev, tripId: trip.id }));
    });
    merged.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date - b.date;
    });
    return merged;
  }, [state.trips]);

  const { summaryHtml, summaryTextPlain } = useMemo(
    () => buildSummaryFromEvents(state, mergedEventsAllTrips),
    [state, mergedEventsAllTrips]
  );

  // ... (Keep existing update/add/remove handlers) ...
  const updateTrip = (tripId, patch) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, ...patch } : t)) }));
  const updateStop = (tripId, stopId, patch) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: t.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)) } : t)) }));
  const addTrip = () => { const tr = emptyTrip(); setState((p) => ({ ...p, trips: [...p.trips, tr] })); setPendingScrollId(tr.id); };
  const removeTrip = (tripId) => setState((p) => ({ ...p, trips: p.trips.filter((t) => t.id !== tripId) }));
  const addStop = (tripId) => { const s = emptyStop(); setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: [...t.stops, s] } : t)) })); setPendingScrollId(s.id); };
  const removeStop = (tripId, stopId) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: t.stops.filter((s) => s.id !== stopId) } : t)) }));
  const addLayover = (tripId) => { const l = emptyLayover(tripId); setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: [...t.layovers, l] } : t)) })); setPendingScrollId(l.id); };
  const updateLayover = (tripId, layoverId, patch) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: t.layovers.map((l) => (l.id === layoverId ? { ...l, ...patch } : l)) } : t)) }));
  const removeLayover = (tripId, layoverId) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: t.layovers.filter((l) => l.id !== layoverId) } : t)) }));
  const addPastTravel = () => { const pt = emptyPastTravel(); setState(p => ({ ...p, pastTravels: [...p.pastTravels, pt] })); setPendingScrollId(pt.id); };
  const updatePastTravel = (id, patch) => setState(p => ({ ...p, pastTravels: p.pastTravels.map(pt => pt.id === id ? { ...pt, ...patch } : pt) }));
  const removePastTravel = (id) => setState(p => ({ ...p, pastTravels: p.pastTravels.filter(pt => pt.id !== id) }));
  const clearAll = () => { if (confirm('Clear all data?')) setState(initialState); };

  return (
    <main className="py-10 sm:py-14">
      <header className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Travel History Generator</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Build a clear, concise travel history for clinical use.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={() => setPrintOpen(true)} className={BTN_PRIMARY}>
            <Icons.Printer className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
          <button type="button" onClick={clearAll} className={BTN_SECONDARY}>Clear all</button>
        </div>
      </header>

      <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-4 text-amber-900 dark:text-amber-200 flex items-center gap-3">
        <span className="shrink-0 text-amber-600 dark:text-amber-400">
           <Icons.Alert className="w-5 h-5" />
        </span>
        <p className="text-sm font-medium">Do not enter private or patient-identifiable information.</p>
      </div>

      {issues.length > 0 && (
        <div className="mb-6 space-y-2" aria-live="polite">
          {issues.map((e, i) => (
            <div key={i} className={classNames('rounded-lg border px-3 py-2 text-sm', e.level === 'error' ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-200' : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-600/60 dark:bg-amber-900/20 dark:text-amber-200')}>
              {e.msg}
            </div>
          ))}
        </div>
      )}

      {/* Trip Builder */}
      <section className="space-y-10">
        {state.trips.map((trip, tIdx) => (
          <TripCard
            key={trip.id}
            innerRef={setItemRef(trip.id)}
            trip={trip}
            index={tIdx}
            totalTrips={state.trips.length}
            updateTrip={updateTrip}
            updateStop={updateStop}
            addStop={addStop}
            removeStop={removeStop}
            addLayover={addLayover}
            updateLayover={updateLayover}
            removeLayover={removeLayover}
            removeTrip={removeTrip}
            highlight={highlight}
            setItemRef={setItemRef}
          />
        ))}
        <div>
          <button type="button" onClick={addTrip} className={BTN_PRIMARY}>+ Add another trip</button>
        </div>
      </section>

      {/* NEW: Significant Past Travel */}
      <section className="mt-10 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <h2 className={SECTION_HEADING}>Significant Past Travel</h2>
        <div className="space-y-4 mt-4">
          {state.pastTravels.length === 0 && (
            <p className="text-sm text-slate-500 italic">No past travels added.</p>
          )}
          {state.pastTravels.map((pt, i) => (
            <div key={pt.id} ref={setItemRef(pt.id)} className="grid gap-4 sm:grid-cols-12 items-start p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Country</label>
                <SearchableSelect 
                  value={pt.country} 
                  onChange={(val) => updatePastTravel(pt.id, { country: val })} 
                  options={CSC_COUNTRIES.map(c => c.name)}
                  placeholder="Select country"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Year / Time</label>
                <div className={TEXT_INPUT_CLASS}>
                  <input 
                    type="text" 
                    placeholder="e.g. 2012" 
                    className={INPUT_BASE}
                    value={pt.year}
                    onChange={(e) => updatePastTravel(pt.id, { year: e.target.value })} 
                  />
                </div>
              </div>
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Details</label>
                <textarea 
                  rows={1}
                  placeholder="Describe details..."
                  className={clsx(TEXTAREA_CLASS, "min-h-[42px]")}
                  value={pt.details}
                  onChange={(e) => updatePastTravel(pt.id, { details: e.target.value })}
                />
              </div>
              <div className="sm:col-span-1 flex justify-end pt-6">
                <button type="button" onClick={() => removePastTravel(pt.id)} className="text-slate-400 hover:text-rose-500 transition p-2">
                  <Icons.Trash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addPastTravel} className={LINKISH_SECONDARY}>+ Add entry</button>
        </div>
      </section>

      {/* Print Overlay */}
      <PrintOverlay 
        open={printOpen} 
        onClose={() => setPrintOpen(false)} 
        events={mergedEventsAllTrips} 
        summaryHtml={summaryHtml} 
        summaryText={summaryTextPlain}
      />
    </main>
  );
}

// ===== Print / Summary Components =====

function PrintOverlay({ open, onClose, events, summaryHtml, summaryText }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:rounded-lg h-[90vh] flex flex-col">
                {/* Header (No Print) */}
                <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-b border-slate-200 print:hidden shrink-0">
                  <div className="flex gap-2">
                    <button type="button" className={BTN_PRIMARY} onClick={handlePrint}>Print / Save PDF</button>
                    <button type="button" className={BTN_SECONDARY} onClick={onClose}>Close</button>
                  </div>
                </div>

                {/* Printable Content */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-12 print:p-0 print:overflow-visible" id="print-root">
                  <div className="max-w-3xl mx-auto space-y-8">
                    
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-4 mb-8">
                       <h1 className="text-3xl font-bold text-slate-900">Travel History Report</h1>
                       <p className="text-sm text-slate-500 mt-1">Generated {format(new Date(), 'dd MMM yyyy')}</p>
                    </div>

                    {/* MAP VISUALIZATION */}
                    <div className="mb-8 break-inside-avoid print:break-inside-avoid h-[400px] w-full rounded border border-slate-300 overflow-hidden">
                      <TravelMap events={events} />
                    </div>

                    {/* TEXT SUMMARY */}
                    <div>
                       <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-2">Detailed Summary</h2>
                       <div className="prose prose-sm max-w-none prose-slate text-slate-900" dangerouslySetInnerHTML={{ __html: summaryHtml }} />
                    </div>

                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function TravelMap({ events }) {
  // 1. Build route points
  const route = useMemo(() => {
    const points = [];
    const pins = [];
    let bounds = [];
    
    // Group events by trip to separate polylines if needed, but for now we do one continuous flow per trip
    // Actually, let's just grab Stops to draw the lines
    const tripMap = new Map();
    events.forEach(ev => {
       if(!tripMap.has(ev.tripId)) tripMap.set(ev.tripId, { origin: ev.stop?.tripOriginCountry, stops: [] });
       if(ev.type === 'stop') tripMap.get(ev.tripId).stops.push(ev);
    });

    tripMap.forEach((data, tripId) => {
      // Try to get origin coords
      const originCoords = getCoordsFromCountryName(data.origin);
      let lastCoords = originCoords;

      if (originCoords) {
        points.push(originCoords);
        bounds.push(originCoords);
      }

      data.stops.forEach(ev => {
        const coords = getCoordsFromCountryName(ev.stop.country);
        if (coords) {
          points.push(coords);
          bounds.push(coords);
          lastCoords = coords;

          // Add Marker for Stop
          const dateStr = `${formatDMY(ev.stop.arrival)} - ${formatDMY(ev.stop.departure)}`;
          pins.push({ 
            position: coords, 
            label: `${ev.stop.country} (${dateStr})` 
          });
        }
      });

      // Optionally close loop if return to origin? 
      // Usually users want to see the path back.
      if (originCoords) {
        points.push(originCoords);
      }
    });

    return { points, pins, bounds };
  }, [events]);

  // Center logic
  const center = route.bounds.length > 0 ? route.bounds[0] : [20, 0];
  const zoom = route.bounds.length > 0 ? 2 : 2;

  // IMPORTANT: MapContainer needs a key to force re-render if data changes significantly
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Route Line */}
      {route.points.length > 1 && (
        <Polyline 
          positions={route.points} 
          pathOptions={{ color: 'hsl(var(--brand))', weight: 3, dashArray: '10, 10', opacity: 0.7 }} 
        />
      )}

      {/* Markers */}
      {route.pins.map((pin, i) => (
        <Marker key={i} position={pin.position}>
          <Tooltip permanent direction="top" offset={[0, -20]} className="text-xs font-bold border border-slate-300 shadow-sm bg-white/90 px-2 py-1 rounded">
             {pin.label}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}

// ... (Keep existing TripCard, StopCard, ExposureTagSystem, LayoverCard, buildSummaryFromEvents helpers) ...
// (Due to file size limits, assume the rest of the file below remains identical to v42 provided previously)
// RE-PASTING THE HELPERS BELOW FOR COMPLETENESS:

function TripCard({
  trip, index, totalTrips, updateTrip, updateStop, addStop, removeStop, addLayover, updateLayover, removeLayover, removeTrip,
  highlight, setItemRef, innerRef
}) {
  const setMalaria = (patch) => {
    const next = { ...trip.malaria, ...patch };
    if (next.indication !== 'Taken') { next.drug = 'None'; next.adherence = ''; }
    updateTrip(trip.id, { malaria: next });
  };

  const setVaccines = (patch) => {
    // patch could be { status: 'Taken' } or { details: [] }
    const next = { ...trip.vaccines, ...patch };
    if (next.status !== 'Taken') { next.details = []; }
    updateTrip(trip.id, { vaccines: next });
  };

  const updateCompanions = (patch) => {
    updateTrip(trip.id, { companions: { ...trip.companions, ...patch } });
  };

  const originISO2 = useMemo(() => getIsoFromCountryName(trip.originCountry), [trip.originCountry]);
  const originCityNames = useMemo(() => {
    const list = originISO2 ? (City.getCitiesOfCountry(originISO2) || []) : [];
    const names = Array.from(new Set(list.map((c) => c.name)));
    names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return names;
  }, [originISO2]);

  const headerTitle = totalTrips > 1 ? `Trip ${index + 1}` : "Trip details";

  return (
    <div ref={innerRef} className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className={SECTION_HEADING}>{headerTitle}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => addStop(trip.id)} className={BTN_PRIMARY}>+ Add destination</button>
          <button type="button" onClick={() => addLayover(trip.id)} className={BTN_PRIMARY}>+ Add layover</button>
          <button type="button" onClick={() => removeTrip(trip.id)} className={BTN_SECONDARY}>Remove trip</button>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Travelling from</label>
        <div className="mt-2 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Country</label>
            <SearchableSelect 
              value={trip.originCountry} 
              onChange={(val) => updateTrip(trip.id, { originCountry: val, originCity: '' })} 
              options={CSC_COUNTRIES.map(c => c.name)}
              placeholder="Select country"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">City</label>
            <SearchableSelect 
              value={trip.originCity} 
              onChange={(val) => updateTrip(trip.id, { originCity: val })} 
              options={originCityNames}
              placeholder="Search city"
              allowCustom={true} 
            />
          </div>
        </div>
      </div>

      {/* COMPRESSED TRIP CONTEXT GRID (2x2) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
        
        {/* TOP LEFT: Reason */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">What was the reason for travel?</label>
          <div className={TEXT_INPUT_CLASS}>
            <input 
              type="text" 
              placeholder="Work, VFR, tourism, etc." 
              className={INPUT_BASE} 
              value={trip.purpose} 
              onChange={(e) => updateTrip(trip.id, { purpose: e.target.value })} 
            />
          </div>
        </div>

        {/* TOP RIGHT: Companions */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Who did they travel with?</label>
          <div className="flex flex-wrap gap-2">
            {COMPANION_GROUPS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const next = { group: opt };
                  if (opt === 'Alone') { 
                    next.companionsWell = 'unknown'; 
                    next.companionsUnwellDetails = ''; 
                    next.otherText = ''; 
                  }
                  updateCompanions(next);
                }}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition",
                  trip.companions.group === opt
                    ? "bg-[hsl(var(--brand))] text-white border-transparent"
                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[hsl(var(--brand))]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>

          <SmoothReveal show={trip.companions.group === 'Other'}>
            <div className="mt-2">
              <div className={TEXT_INPUT_CLASS}>
                <input 
                  type="text" 
                  className={INPUT_BASE}
                  placeholder="Describe companions..."
                  value={trip.companions.otherText}
                  onChange={(e) => updateCompanions({ otherText: e.target.value })}
                />
              </div>
            </div>
          </SmoothReveal>

          <SmoothReveal show={trip.companions.group !== 'Alone'}>
            <div className="mt-2 grid gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Are they well?</label>
                <div className="flex gap-2">
                  {COMPANION_WELL_OPTIONS.map((opt) => {
                    const val = opt.toLowerCase(); 
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => updateCompanions({ companionsWell: val, companionsUnwellDetails: val === 'no' ? trip.companions.companionsUnwellDetails : '' })}
                        className={clsx(
                          "px-2 py-1 text-xs font-medium rounded border transition",
                          trip.companions.companionsWell === val
                            ? "bg-[hsl(var(--brand))] text-white border-transparent"
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <SmoothReveal show={trip.companions.companionsWell === 'no'}>
                <div>
                  <div className={TEXT_INPUT_CLASS}>
                    <input 
                      type="text" 
                      placeholder="Details (symptoms, etc.)"
                      className={INPUT_BASE}
                      value={trip.companions.companionsUnwellDetails}
                      onChange={(e) => updateCompanions({ companionsUnwellDetails: e.target.value })}
                    />
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </SmoothReveal>
        </div>

        {/* BOTTOM LEFT: Vaccines */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Did they have any pre-travel vaccinations?</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {VACCINE_STATUS_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setVaccines({ status: opt })}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition",
                  (trip.vaccines?.status || 'unknown') === opt
                    ? "bg-[hsl(var(--brand))] text-white border-transparent"
                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[hsl(var(--brand))]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <SmoothReveal show={trip.vaccines?.status === 'Taken'}>
             <div>
               <label className="block text-xs font-medium text-slate-500 mb-1">Details (Select multiple or type custom)</label>
               <MultiSelectTags 
                 value={trip.vaccines.details || []}
                 onChange={(val) => setVaccines({ details: val })}
                 options={VACCINE_SUGGESTIONS}
                 placeholder="Select or type..."
               />
             </div>
          </SmoothReveal>
        </div>

        {/* BOTTOM RIGHT: Malaria */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Did they take any malaria prophylaxis?</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {MALARIA_STATUS_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setMalaria({ indication: opt })}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition",
                  trip.malaria.indication === opt
                    ? "bg-[hsl(var(--brand))] text-white border-transparent"
                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[hsl(var(--brand))]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <SmoothReveal show={trip.malaria.indication === 'Taken'}>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Drug</label>
                <SimpleSelect value={trip.malaria.drug} onChange={(val) => setMalaria({ drug: val })} options={MALARIA_DRUGS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Adherence</label>
                <SimpleSelect value={trip.malaria.adherence} onChange={(val) => setMalaria({ adherence: val })} options={ADHERENCE_OPTIONS} />
              </div>
            </div>
          </SmoothReveal>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {trip.stops.map((stop, sIdx) => (
          <StopCard 
            key={stop.id} 
            innerRef={setItemRef(stop.id)} 
            stop={stop} 
            index={sIdx} 
            totalStops={trip.stops.length}
            onChange={(patch) => updateStop(trip.id, stop.id, patch)} 
            onRemove={() => removeStop(trip.id, stop.id)} 
            highlighted={highlight.stopIds.has(stop.id)} 
          />
        ))}
      </div>

      {trip.layovers.length > 0 && (
        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Layovers</h3>
          <div className="space-y-4">
            {trip.layovers.map((l) => (
              <LayoverCard key={l.id} innerRef={setItemRef(l.id)} layover={l} onChange={(patch) => updateLayover(trip.id, l.id, patch)} onRemove={() => removeLayover(trip.id, l.id)} highlighted={highlight.layoverIds.has(l.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StopCard({ stop, index, totalStops, onChange, onRemove, innerRef, highlighted }) {
  const exp = stop.exposures;
  const normalizedCities = (stop.cities || []).map((c) =>
    typeof c === 'string' ? { name: c || '', arrival: '', departure: '' } : { name: c?.name || '', arrival: c?.arrival || '', departure: c?.departure || '' }
  );
  const countryISO2 = useMemo(() => {
    const name = (stop.country || "").trim().toLowerCase();
    if (!name) return null;
    const match = Country.getAllCountries().find((c) => c.name.trim().toLowerCase() === name);
    return match?.isoCode || null;
  }, [stop.country]);
  const cityOptions = useMemo(() => { return countryISO2 ? City.getCitiesOfCountry(countryISO2) : []; }, [countryISO2]);
  const commitCities = (next) => onChange({ cities: next });
  const setCityName = (i, name) => { const next = [...normalizedCities]; next[i] = { ...next[i], name }; commitCities(next); };
  const setCityArrival = (i, arrival) => { const next = [...normalizedCities]; next[i] = { ...next[i], arrival }; commitCities(next); };
  const setCityDeparture = (i, departure) => { const next = [...normalizedCities]; next[i] = { ...next[i], departure }; commitCities(next); };
  const addCity = () => { commitCities([...normalizedCities, { name: '', arrival: '', departure: '' }]); };
  const removeCity = (i) => { const next = [...normalizedCities]; next.splice(i, 1); if (next.length === 0) next.push({ name: '', arrival: '', departure: '' }); commitCities(next); };
  const toggleAccommodation = (value) => { const set = new Set(stop.accommodations || []); if (set.has(value)) set.delete(value); else set.add(value); onChange({ accommodations: Array.from(set) }); };

  const headerTitle = totalStops > 1 ? `Destination ${index + 1}` : "Destination";

  return (
    <div ref={innerRef} className={classNames("rounded-lg border p-4", highlighted ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10" : "border-slate-200 dark:border-slate-800")}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{headerTitle}</h3>
        <button type="button" onClick={onRemove} className={LINKISH_SECONDARY}>Remove destination</button>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="w-full">
           <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Country</label>
           <SearchableSelect 
              value={stop.country} 
              onChange={(val) => onChange({ country: val })} 
              options={CSC_COUNTRIES.map(c => c.name)}
              placeholder="Select country"
           />
        </div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Arrival *</label><ResponsiveDatePicker value={stop.arrival} onChange={(val) => onChange({ arrival: val })} /></div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Departure *</label><ResponsiveDatePicker value={stop.departure} onChange={(val) => onChange({ departure: val })} /></div>
      </div>

      <div className="mt-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-1">
          <div><label className="block text-sm text-slate-600 dark:text-slate-300">City</label></div>
          <div><label className="block text-sm text-slate-600 dark:text-slate-300">Arrival</label></div>
          <div><label className="block text-sm text-slate-600 dark:text-slate-300">Departure</label></div>
        </div>
        <div className="space-y-2">
          {normalizedCities.map((row, i) => {
            return (
              <div key={i} className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="w-full">
                  <SearchableSelect 
                    value={row.name} 
                    onChange={(val) => setCityName(i, val)} 
                    options={cityOptions.map(c => c.name)}
                    placeholder="Search city"
                    allowCustom={true} 
                  />
                </div>
                <ResponsiveDatePicker value={row.arrival} onChange={(val) => setCityArrival(i, val)} />
                <ResponsiveDatePicker value={row.departure} onChange={(val) => setCityDeparture(i, val)} />
                <div className="flex"><button type="button" onClick={() => removeCity(i)} className="w-full sm:w-auto rounded-lg px-3 py-2 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition">Remove</button></div>
              </div>
            );
          })}
          <button type="button" onClick={addCity} className="rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition text-slate-600 dark:text-slate-400">+ Add another city</button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">What sort of accommodation did they stay in?</label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ACCOMMODATION_OPTIONS.map((opt) => {
            const checked = (stop.accommodations || []).includes(opt);
            const id = `${stop.id}-accom-${opt.replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <label key={opt} htmlFor={id} className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                <input id={id} type="checkbox" className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700 text-[hsl(var(--brand))] focus:ring-[hsl(var(--brand))]" checked={checked} onChange={() => toggleAccommodation(opt)} />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
        {(stop.accommodations || []).includes('Other') && (
          <div className="mt-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Other (describe)</label>
            <div className={TEXT_INPUT_CLASS}>
              <input type="text" className={INPUT_BASE} value={stop.accommodationOther} onChange={(e) => onChange({ accommodationOther: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Did they have any of the following exposures or activities?</h4>
        <ExposureTagSystem exposures={exp} onChange={(newExp) => onChange({ exposures: newExp })} />
      </div>
    </div>
  );
}

function ExposureTagSystem({ exposures, onChange }) {
  // Helper to set state directly (yes/no/unknown)
  const setItem = (key, val) => {
    onChange({ ...exposures, [key]: val });
  };

  const markRestAsNo = () => {
    const patch = {};
    EXPOSURE_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        const key = item.key;
        const current = exposures[key] || 'unknown';
        if (current === 'unknown') {
          patch[key] = 'no';
        }
      });
    });
    onChange({ ...exposures, ...patch });
  };

  // Check if any positive to reveal the detail box
  const hasPositive = EXPOSURE_CATEGORIES.some(cat => 
    cat.items.some(item => exposures[item.key] === 'yes' || exposures[item.key] === true)
  );

  return (
    <div className="space-y-6">
      {/* 1. Categorized 2-Col Grid of Cards */}
      <div className="space-y-6">
        {EXPOSURE_CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">{cat.title}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.items.map((item) => {
                const status = exposures[item.key] || 'unknown';
                const isYes = status === 'yes' || status === true;
                const isNo = status === 'no' || status === false;

                return (
                  <div 
                    key={item.key} 
                    className="flex items-center justify-between p-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all"
                  >
                    <span className="text-xs font-medium mr-2 truncate text-slate-700 dark:text-slate-300" title={item.label}>
                      {item.label}
                    </span>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setItem(item.key, 'yes')}
                        className={clsx(
                          "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors",
                          isYes 
                            ? "bg-[hsl(var(--brand))] text-white border-transparent" 
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                        )}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setItem(item.key, 'no')}
                        className={clsx(
                          "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors",
                          isNo 
                            ? "bg-slate-600 text-white border-transparent" 
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                        )}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Global Actions */}
      <div className="flex justify-end pt-2">
        <button 
          type="button" 
          onClick={markRestAsNo}
          className="text-xs font-medium text-[hsl(var(--brand))] hover:underline underline-offset-4 decoration-2"
        >
          Mark remaining as 'No'
        </button>
      </div>

      {/* 3. Single Detail Input (Only if 'Yes' selected) */}
      <SmoothReveal show={hasPositive}>
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Kindly provide more detail about positive exposures</label>
          <textarea 
            rows={3} 
            className={TEXTAREA_CLASS}
            value={exposures.positiveDetails || ''}
            onChange={(e) => onChange({ ...exposures, positiveDetails: e.target.value })} 
          />
        </div>
      </SmoothReveal>

      {/* 4. Other Text */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1 font-medium">Any other trip details or exposures</label>
        <textarea 
          rows={2} 
          className={TEXTAREA_CLASS}
          value={exposures.otherText} 
          onChange={(e) => onChange({ ...exposures, otherText: e.target.value })} 
        />
      </div>
    </div>
  );
}

function LayoverCard({ layover, onChange, onRemove, innerRef, highlighted }) {
  const countryISO2 = useMemo(() => getIsoFromCountryName(layover.country), [layover.country]);
  const cityOptions = useMemo(() => { return countryISO2 ? (City.getCitiesOfCountry(countryISO2) || []) : []; }, [countryISO2]);

  return (
    <div ref={innerRef} className={classNames("rounded-lg border p-4", highlighted ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10" : "border-slate-200 dark:border-slate-800")}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Layover</h4>
        <button type="button" onClick={onRemove} className={LINKISH_SECONDARY}>Remove layover</button>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="w-full">
           <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Country</label>
           <SearchableSelect 
              value={layover.country} 
              onChange={(val) => { onChange({ country: val, city: "" }); }} 
              options={CSC_COUNTRIES.map(c => c.name)}
              placeholder="Select country"
           />
        </div>
        <div className="w-full">
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">City</label>
          <SearchableSelect 
              value={layover.city} 
              onChange={(val) => onChange({ city: val })} 
              options={cityOptions.map(c => c.name)}
              placeholder="Search city"
              allowCustom={true} 
           />
        </div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Start</label><ResponsiveDatePicker value={layover.start} onChange={(val) => onChange({ start: val })} /></div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">End</label><ResponsiveDatePicker value={layover.end} onChange={(val) => onChange({ end: val })} /></div>
      </div>
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Did you leave the airport?</label>
          <SimpleSelect 
            value={layover.leftAirport} 
            onChange={(val) => onChange({ leftAirport: val })} 
            options={['no', 'yes']}
          />
        </div>
        {layover.leftAirport === "yes" && (<div className="sm:col-span-2"><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Please describe any activities undertaken</label><textarea rows={3} className={TEXTAREA_CLASS} value={layover.activitiesText} onChange={(e) => onChange({ activitiesText: e.target.value })} /></div>)}
      </div>
    </div>
  );
}

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

      const { positives, negatives, otherText } = exposureBullets(s.exposures);
      
      if (positives.length > 0) { 
        const labels = positives.map(p => p.label).join(", ");
        html.push(`<div><strong>Exposures:</strong> ${escapeHtml(labels)}</div>`); 
        text.push(`Exposures: ${labels}`);
        
        // Narrative Detail
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

      // Fallback if nothing
      if (positives.length === 0 && negatives.length === 0 && !otherText) {
         html.push(`<div>Exposures: —</div>`);
         text.push(`Exposures: —`);
      }

      const betweenList = (layoversByStop.get(s.id)?.between || []).map(fmtLayover);
      if (betweenList.length) { html.push(`<div>Layovers to next destination:</div>`); text.push(`Layovers to next destination:`); html.push(`<ul>${betweenList.map((v) => `<li>${v.html}</li>`).join("")}</ul>`); betweenList.forEach((v) => text.push(`- ${v.text}`)); }

      if (isLastStop) {
        const afterList = (layoversByStop.get(s.id)?.after || []).map(fmtLayover);
        if (afterList.length) { html.push(`<div>Layovers after this trip:</div>`); text.push(`Layovers after this trip:`); html.push(`<ul>${afterList.map((v) => `<li>${v.html}</li>`).join("")}</ul>`); afterList.forEach((v) => text.push(`- ${v.text}`)); }
      }
    });
    tripIndex += 1;
  }

  // --- APPEND PAST TRAVELS ---
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

function escapeHtml(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function exposureBullets(exp) {
  if (!exp) return { positives: [], negatives: [], otherText: '' };
  
  const positives = []; 
  const negatives = [];
  
  // NOTE: detail text is now centralized in exp.positiveDetails
  const detailText = exp.positiveDetails?.trim() || '';

  const push = (label, key) => {
    let s = exp[key]; 
    if (typeof s === 'boolean') s = s ? 'yes' : 'unknown';
    if (s === 'yes') { 
        // We push the label, and attach the GLOBAL detail string to the first item only
        // so the summary builder knows where to grab it.
        positives.push({ label: cap(label), details: positives.length === 0 ? detailText : '' }); 
    } else if (s === 'no') { 
        negatives.push(cap(label)); 
    }
  };

  // Explicit mapping based on EXPOSURE_CATEGORIES logic
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
