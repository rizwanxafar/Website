'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v13 (Phase 3: Manchester Tech Polish)
// Changes:
// - Default Origin: United Kingdom / Manchester
// - Added SVGs for Plane, MapPin, Calendar, Trash, etc.
// - Added "Empty State" UI for trips with no stops
// - Refined typography and focus states (Manchester Tech vibe)

import { useEffect, useMemo, useRef, useState } from 'react';

// ---- Minimal countries stub for datalist ----
import CountryInput from "@/components/inputs/CountryInput";
import { Country, City } from "country-state-city";

// --- country-state-city helpers ---
const CSC_COUNTRIES = Country.getAllCountries();

function getIsoFromCountryName(name) {
  if (!name) return "";
  const q = name.trim().toLowerCase();
  let hit = CSC_COUNTRIES.find(c => c.name.toLowerCase() === q);
  if (hit) return hit.isoCode;
  const norm = (s) =>
    s.normalize?.("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, "").trim().toLowerCase() || s.toLowerCase();
  const qn = norm(q);
  hit = CSC_COUNTRIES.find(c => norm(c.name) === qn);
  return hit ? hit.isoCode : "";
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

const MALARIA_DRUGS = ['None', 'Atovaquone/Proguanil', 'Doxycycline', 'Mefloquine', 'Chloroquine'];
const MALARIA_INDICATIONS = ['Not indicated', 'Taken', 'Not taken'];

// ---- Theme Classes ----
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white " +
  "bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition shadow-sm " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-slate-100";

const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium " +
  "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 " +
  "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition shadow-sm";

const BTN_GHOST_DANGER = 
  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium " +
  "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 transition";

const INPUT_CLASS = 
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:border-transparent transition shadow-sm";

const CHECKBOX_CLASS = 
  "h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700 text-[hsl(var(--brand))] focus:ring-[hsl(var(--brand))]";

const NODE_COLOR = "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))]";

// ---- Icons (Inline SVGs for copy-paste reliability) ----
const Icons = {
  Plane: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12h20"/><path d="M13 2a9 9 0 0 0-9 9H2"/><path d="M20 22a9 9 0 0 0-9-9h11"/><circle cx="12" cy="12" r="10"/></svg>, 
  MapPin: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Calendar: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  Trash: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Plus: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  ChevronDown: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6"/></svg>,
  ChevronUp: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m18 15-6-6-6 6"/></svg>,
  Alert: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
  Copy: (p) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
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
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  const aS = parseDate(aStart), aE = parseDate(aEnd), bS = parseDate(bStart), bE = parseDate(bEnd);
  if (!aS || !aE || !bS || !bE) return false;
  return aS < bE && bS < aE;
}

// ---- Initial State ----
const emptyStop = () => ({
  id: uid(),
  country: '',
  cities: [{ name: '', arrival: '', departure: '' }],
  arrival: '',
  departure: '',
  accommodations: [],
  accommodationOther: '',
  exposures: {
    mosquito: 'unknown', mosquitoDetails: '',
    tick: 'unknown', tickDetails: '',
    vectorOtherEnabled: 'unknown', vectorOtherDetails: '',
    freshwater: 'unknown', freshwaterDetails: '',
    cavesMines: 'unknown', cavesMinesDetails: '',
    ruralForest: 'unknown', ruralForestDetails: '',
    hikingWoodlands: 'unknown', hikingWoodlandsDetails: '',
    animalContact: 'unknown', animalContactDetails: '',
    animalBiteScratch: 'unknown', animalBiteScratchDetails: '',
    bushmeat: 'unknown', bushmeatDetails: '',
    needlesTattoos: 'unknown', needlesTattoosDetails: '',
    safariWildlife: 'unknown', safariWildlifeDetails: '',
    streetFood: 'unknown', streetFoodDetails: '',
    untreatedWater: 'unknown', untreatedWaterDetails: '',
    undercookedFood: 'unknown', undercookedFoodDetails: '',
    undercookedSeafood: 'unknown', undercookedSeafoodDetails: '',
    unpasteurisedMilk: 'unknown', unpasteurisedMilkDetails: '',
    funerals: 'unknown', funeralsDetails: '',
    largeGatherings: 'unknown', largeGatheringsDetails: '',
    sickContacts: 'unknown', sickContactsDetails: '',
    healthcareFacility: 'unknown', healthcareFacilityDetails: '',
    prison: 'unknown', prisonDetails: '',
    refugeeCamp: 'unknown', refugeeCampDetails: '',
    unprotectedSex: 'unknown', unprotectedSexDetails: '',
    otherText: '',
  },
});

const emptyLayover = (tripId) => ({
  id: uid(), tripId, country: '', city: '', start: '', end: '', leftAirport: 'no', activitiesText: '',
});

// DEFAULT OVERRIDES APPLIED HERE
const emptyTrip = () => ({
  id: uid(),
  purpose: '',
  originCountry: 'United Kingdom', 
  originCity: 'Manchester',
  vaccines: [],
  vaccinesOther: '',
  malaria: { indication: 'Not indicated', drug: 'None', adherence: '' },
  stops: [emptyStop()],
  layovers: [],
});

const initialState = {
  trips: [emptyTrip()],
  companions: {
    group: 'Alone',
    otherText: '',
    companionsWell: 'unknown',
    companionsUnwellDetails: '',
  },
};

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
        tripVaccines: trip.vaccines || [], tripVaccinesOther: trip.vaccinesOther || '',
        tripMalaria: trip.malaria || { indication: 'Not indicated', drug: 'None', adherence: '' },
        tripCompanions: companions || null,
        tripOriginCountry: trip.originCountry || '', tripOriginCity: trip.originCity || '',
      },
    });
    if (i === 0 && beforeFirst.length) {
      beforeFirst.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l, anchorStopId: s.id, position: 'before-stop' }));
    }
    if (i < betweenByIndex.length) {
      const group = betweenByIndex[i].sort((a, b) => (parseDate(a.start) - parseDate(b.start)));
      group.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l, anchorStopId: s.id, position: 'between' }));
    }
    if (isLastInTrip && afterLast.length) {
      afterLast.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l, anchorStopId: s.id, position: 'after-stop' }));
    }
  });
  return events;
}

// ===== Main Page Component =====
export default function TravelHistoryGeneratorPage() {
  const [state, setState] = useState(initialState);
  const [issues, setIssues] = useState([]);
  const [highlight, setHighlight] = useState({ stopIds: new Set(), layoverIds: new Set() });
  const [pendingScrollId, setPendingScrollId] = useState(null);
  const itemRefs = useRef(new Map());
  const setItemRef = (id) => (el) => { if (el) itemRefs.current.set(id, el); };

  useEffect(() => {
    const hasData = state.trips.some(t => t.stops.length > 0 || t.layovers.length > 0);
    const onBeforeUnload = (e) => { if (!hasData) return; e.preventDefault(); e.returnValue = ""; };
    if (hasData) window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.trips]);

  useEffect(() => {
    const list = [];
    const stopIds = new Set();
    const layIds = new Set();
    state.trips.forEach((trip, tIdx) => {
      trip.stops.forEach((s, sIdx) => {
        if (s.arrival && s.departure) {
          const a = parseDate(s.arrival), d = parseDate(s.departure);
          if (a && d && a > d) {
            list.push({ level: 'error', msg: `Trip ${tIdx + 1}, Stop ${sIdx + 1}: Arrival is after departure.` });
            stopIds.add(s.id);
          }
        }
      });
      for (let i = 0; i < trip.stops.length; i++) {
        for (let j = i + 1; j < trip.stops.length; j++) {
          const A = trip.stops[i], B = trip.stops[j];
          if (rangesOverlap(A.arrival, A.departure, B.arrival, B.departure)) {
            list.push({ level: 'error', msg: `Trip ${tIdx + 1}: Stops ${i + 1} and ${j + 1} overlap.` });
            stopIds.add(A.id); stopIds.add(B.id);
          }
        }
      }
      for (let i = 0; i < trip.layovers.length; i++) {
        for (let j = i + 1; j < trip.layovers.length; j++) {
          const A = trip.layovers[i], B = trip.layovers[j];
          if (rangesOverlap(A.start, A.end, B.start, B.end)) {
            list.push({ level: 'error', msg: `Trip ${tIdx + 1}: Layovers overlap.` });
            layIds.add(A.id); layIds.add(B.id);
          }
        }
      }
      trip.layovers.forEach((L, li) => {
        trip.stops.forEach((S, si) => {
          if (rangesOverlap(L.start, L.end, S.arrival, S.departure)) {
            list.push({ level: 'error', msg: `Trip ${tIdx + 1}: Layover ${li + 1} overlaps Stop ${si + 1}.` });
            layIds.add(L.id); stopIds.add(S.id);
          }
        });
      });
    });
    setIssues(list);
    setHighlight({ stopIds, layoverIds: layIds });
  }, [state.trips]);

  useEffect(() => {
    if (!pendingScrollId) return;
    const el = itemRefs.current.get(pendingScrollId);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const t = setTimeout(() => setPendingScrollId(null), 600);
    return () => clearTimeout(t);
  }, [pendingScrollId]);

  const mergedEventsAllTrips = useMemo(() => {
    const merged = [];
    state.trips.forEach((trip) => {
      buildTripEvents(trip, state.companions).forEach((ev) => merged.push({ ...ev, tripId: trip.id }));
    });
    merged.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date - b.date;
    });
    return merged;
  }, [state.trips, state.companions]);

  const { summaryHtml, summaryTextPlain } = useMemo(
    () => buildSummaryFromEvents(state, mergedEventsAllTrips),
    [state, mergedEventsAllTrips]
  );

  const updateTrip = (tripId, patch) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, ...patch } : t)) }));
  const updateStop = (tripId, stopId, patch) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: t.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)) } : t)) }));
  const addTrip = () => { const tr = emptyTrip(); setState((p) => ({ ...p, trips: [...p.trips, tr] })); setPendingScrollId(tr.id); };
  const removeTrip = (tripId) => setState((p) => ({ ...p, trips: p.trips.filter((t) => t.id !== tripId) }));
  const addStop = (tripId) => { const s = emptyStop(); setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: [...t.stops, s] } : t)) })); setPendingScrollId(s.id); };
  const removeStop = (tripId, stopId) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: t.stops.filter((s) => s.id !== stopId) } : t)) }));
  const addLayover = (tripId) => { const l = emptyLayover(tripId); setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: [...t.layovers, l] } : t)) })); setPendingScrollId(l.id); };
  const updateLayover = (tripId, layoverId, patch) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: t.layovers.map((l) => (l.id === layoverId ? { ...l, ...patch } : l)) } : t)) }));
  const removeLayover = (tripId, layoverId) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: t.layovers.filter((l) => l.id !== layoverId) } : t)) }));

  const clearAll = () => { if (confirm('Clear all data?')) setState(initialState); };

  return (
    <main className="py-10 sm:py-14 max-w-5xl mx-auto px-4 sm:px-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Icons.Plane className="text-[hsl(var(--brand))] w-8 h-8" />
            Travel History Generator
          </h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Build a clear, concise travel history. Provide as much information as possible.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={clearAll} className={BTN_SECONDARY}>Clear all</button>
        </div>
      </header>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm">
        <Icons.Alert className="w-5 h-5 mt-0.5 shrink-0" />
        <p className="text-sm font-medium">Do not enter private or patient-identifiable information.</p>
      </div>

      {issues.length > 0 && (
        <div className="mb-6 space-y-2" aria-live="polite">
          {issues.map((e, i) => (
            <div key={i} className={classNames('rounded-lg border px-3 py-2 text-sm font-medium flex items-center gap-2', e.level === 'error' ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200' : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200')}>
              <Icons.Alert className="w-4 h-4" />
              {e.msg}
            </div>
          ))}
        </div>
      )}

      {/* Accordion List */}
      <section className="space-y-6">
        {state.trips.map((trip, tIdx) => (
          <TripCard
            key={trip.id}
            innerRef={setItemRef(trip.id)}
            trip={trip}
            index={tIdx}
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
            defaultOpen={tIdx === state.trips.length - 1} 
          />
        ))}
        <div className="pt-2">
          <button type="button" onClick={addTrip} className={BTN_PRIMARY}>
            <Icons.Plus className="w-4 h-4" />
            Add another trip
          </button>
        </div>
      </section>

      {/* Companions */}
      <section className="mt-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          Companions
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Who did you travel with?</label>
            <div className="flex flex-wrap gap-2">
              {['Alone', 'Family', 'Friends', 'Organised tour', 'Other'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setState((p) => {
                    const next = { ...p.companions, group: opt };
                    if (opt === 'Alone') { next.companionsWell = 'unknown'; next.companionsUnwellDetails = ''; next.otherText = ''; }
                    return { ...p, companions: next };
                  })}
                  className={classNames(
                    'rounded-lg px-3 py-1.5 text-sm border transition',
                    state.companions.group === opt
                      ? 'text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] border-transparent shadow-sm'
                      : 'border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            {state.companions.group === 'Other' && (
              <div className="mt-2">
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Describe</label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={state.companions.otherText}
                  onChange={(e) => setState((p) => ({ ...p, companions: { ...p.companions, otherText: e.target.value } }))}
                />
              </div>
            )}
          </div>
          {state.companions.group !== 'Alone' && (
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Are they well?</label>
              <div className="flex gap-2">
                {[{ val: 'yes', label: 'Yes' }, { val: 'no', label: 'No' }, { val: 'unknown', label: 'Unknown' }].map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setState((p) => ({ ...p, companions: { ...p.companions, companionsWell: val, companionsUnwellDetails: val === 'no' ? p.companions.companionsUnwellDetails : '' } }))}
                    className={classNames(
                      'rounded-lg px-3 py-1.5 text-sm border transition',
                      state.companions.companionsWell === val ? 'text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] border-transparent shadow-sm' : 'border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {state.companions.companionsWell === 'no' && (
                <div className="mt-2">
                  <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Please provide details</label>
                  <textarea
                    rows={3}
                    className={INPUT_CLASS}
                    value={state.companions.companionsUnwellDetails}
                    onChange={(e) => setState((p) => ({ ...p, companions: { ...p.companions, companionsUnwellDetails: e.target.value } }))}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline-section" className="mt-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Icons.Calendar className="w-5 h-5 text-slate-500" />
          Timeline
        </h2>
        <TimelineVertical events={mergedEventsAllTrips} />
      </section>

      {/* Summary */}
      <section className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Icons.Copy className="w-5 h-5 text-slate-500" />
          Summary
        </h2>
        <div className="text-sm text-slate-700 dark:text-slate-300 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div dangerouslySetInnerHTML={{ __html: summaryHtml }} />
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => navigator.clipboard.writeText(summaryTextPlain)} className={BTN_SECONDARY}>
            <Icons.Copy className="w-4 h-4" />
            Copy summary
          </button>
        </div>
      </section>
    </main>
  );
}

// ===== Collapsible Trip Card =====
function TripCard({
  trip, index, updateTrip, updateStop, addStop, removeStop, addLayover, updateLayover, removeLayover, removeTrip,
  highlight, setItemRef, innerRef, defaultOpen
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? true);

  const tripSummary = useMemo(() => {
    const countries = new Set();
    let start = null, end = null;
    trip.stops.forEach(s => {
      if (s.country) countries.add(s.country);
      if (s.arrival) { const d = new Date(s.arrival); if (!start || d < start) start = d; }
      if (s.departure) { const d = new Date(s.departure); if (!end || d > end) end = d; }
    });
    const cStr = countries.size > 0 ? Array.from(countries).join(', ') : 'No countries added';
    const dStr = (start && end) ? `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` : '';
    return { title: cStr, subtitle: dStr };
  }, [trip.stops]);

  const toggleTripVaccine = (v) => {
    const set = new Set(trip.vaccines || []);
    const had = set.has(v);
    if (had) set.delete(v); else set.add(v);
    const patch = { vaccines: Array.from(set) };
    if (v === 'Other' && had) patch.vaccinesOther = '';
    updateTrip(trip.id, patch);
  };

  const setMalaria = (patch) => {
    const next = { ...trip.malaria, ...patch };
    if (next.indication !== 'Taken') { next.drug = 'None'; next.adherence = ''; }
    updateTrip(trip.id, { malaria: next });
  };

  const originISO2 = useMemo(() => getIsoFromCountryName(trip.originCountry), [trip.originCountry]);
  const originCityNames = useMemo(() => {
    const list = originISO2 ? (City.getCitiesOfCountry(originISO2) || []) : [];
    const names = Array.from(new Set(list.map((c) => c.name)));
    names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return names;
  }, [originISO2]);

  return (
    <div ref={innerRef} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden transition-all duration-300 shadow-sm">
      
      {/* HEADER */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
             {isOpen ? <Icons.ChevronUp className="w-5 h-5 text-slate-500" /> : <Icons.ChevronDown className="w-5 h-5 text-slate-500" />}
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">Trip {index + 1}</h3>
            {!isOpen && (
              <p className="text-sm text-slate-500 truncate max-w-md">
                 <span className="font-medium text-slate-700 dark:text-slate-300">{tripSummary.title}</span> 
                 {tripSummary.subtitle && <span className="mx-2 opacity-50">|</span>}
                 {tripSummary.subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             type="button" 
             onClick={(e) => { e.stopPropagation(); removeTrip(trip.id); }} 
             className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
             title="Remove Trip"
           >
             <Icons.Trash className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* BODY */}
      {isOpen && (
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
          
          <div className="grid sm:grid-cols-2 gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Travelling from</label>
              <div className="grid gap-2">
                 <CountryInput value={trip.originCountry} onChange={(val) => updateTrip(trip.id, { originCountry: val, originCity: '' })} />
                 <div className="relative">
                   <input type="text" list={`trip-origin-cities-${trip.id}`} placeholder="City..." className={INPUT_CLASS} value={trip.originCity || ''} onChange={(e) => updateTrip(trip.id, { originCity: e.target.value })} />
                   <datalist id={`trip-origin-cities-${trip.id}`}>{originCityNames.map((nm) => (<option key={nm} value={nm} />))}</datalist>
                 </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Purpose</label>
              <input type="text" placeholder="Work, VFR, tourism, etc." className={INPUT_CLASS} value={trip.purpose} onChange={(e) => updateTrip(trip.id, { purpose: e.target.value })} />
            </div>
          </div>

          <div className="mb-8 grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Vaccinations</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VACCINE_OPTIONS.map((v) => (<Checkbox key={v} label={v} checked={(trip.vaccines || []).includes(v)} onChange={() => toggleTripVaccine(v)} />))}
              </div>
              {(trip.vaccines || []).includes('Other') && (
                <div className="mt-2"><input type="text" placeholder="Enter vaccine name(s)…" className={INPUT_CLASS} value={trip.vaccinesOther || ''} onChange={(e) => updateTrip(trip.id, { vaccinesOther: e.target.value })} /></div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Malaria Prophylaxis</label>
              <div className="grid gap-3">
                <select className={INPUT_CLASS} value={trip.malaria.indication} onChange={(e) => setMalaria({ indication: e.target.value })}>{MALARIA_INDICATIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}</select>
                {trip.malaria.indication === 'Taken' && (
                  <div className="grid grid-cols-2 gap-2">
                    <select className={INPUT_CLASS} value={trip.malaria.drug} onChange={(e) => setMalaria({ drug: e.target.value })}>{MALARIA_DRUGS.map((d) => (<option key={d} value={d}>{d}</option>))}</select>
                    <select className={INPUT_CLASS} value={trip.malaria.adherence} onChange={(e) => setMalaria({ adherence: e.target.value })}><option value="">Adherence…</option><option value="Good">Good</option><option value="Partial">Partial</option><option value="Poor">Poor</option></select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Destinations</h4>
              <div className="flex gap-2">
                <button type="button" onClick={() => addStop(trip.id)} className={BTN_SECONDARY}><Icons.Plus className="w-4 h-4" /> Add stop</button>
                <button type="button" onClick={() => addLayover(trip.id)} className={BTN_SECONDARY}><Icons.Plus className="w-4 h-4" /> Add layover</button>
              </div>
            </div>
            
            {trip.stops.length === 0 && trip.layovers.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                <Icons.MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No destinations added yet.</p>
                <button onClick={() => addStop(trip.id)} className="text-[hsl(var(--brand))] font-medium text-sm hover:underline mt-1">Add your first stop</button>
              </div>
            ) : (
              <>
                {trip.stops.map((stop, sIdx) => (
                  <StopCard key={stop.id} innerRef={setItemRef(stop.id)} stop={stop} index={sIdx} onChange={(patch) => updateStop(trip.id, stop.id, patch)} onRemove={() => removeStop(trip.id, stop.id)} highlighted={highlight.stopIds.has(stop.id)} />
                ))}
                {trip.layovers.length > 0 && (
                  <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">Layovers</h3>
                    <div className="space-y-4">
                      {trip.layovers.map((l) => (
                        <LayoverCard key={l.id} innerRef={setItemRef(l.id)} layover={l} onChange={(patch) => updateLayover(trip.id, l.id, patch)} onRemove={() => removeLayover(trip.id, l.id)} highlighted={highlight.layoverIds.has(l.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StopCard({ stop, index, onChange, onRemove, innerRef, highlighted }) {
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

  return (
    <div ref={innerRef} className={classNames("rounded-xl border p-5 shadow-sm transition bg-slate-50/50 dark:bg-slate-900/20", highlighted ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10" : "border-slate-200 dark:border-slate-800")}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Icons.MapPin className="w-4 h-4 text-[hsl(var(--brand))]" />
          Stop {index + 1}
        </h3>
        <button type="button" onClick={onRemove} className={BTN_GHOST_DANGER}><Icons.Trash className="w-3.5 h-3.5" /> Remove</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CountryInput value={stop.country} onChange={(val) => onChange({ country: val })} />
        <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Arrival</label><input type="date" className={INPUT_CLASS} value={stop.arrival} onChange={(e) => onChange({ arrival: e.target.value })} /></div>
        <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Departure</label><input type="date" className={INPUT_CLASS} value={stop.departure} onChange={(e) => onChange({ departure: e.target.value })} /></div>
      </div>

      <div className="mt-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
        <div className="space-y-3">
          {normalizedCities.map((row, i) => {
            const listId = `city-list-${stop.id}-${i}`;
            return (
              <div key={i} className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
                <div className="w-full">
                   <label className="block text-xs text-slate-400 mb-1">City / Region</label>
                   <input type="text" list={listId} placeholder="City..." className={INPUT_CLASS} value={row.name} onChange={(e) => setCityName(i, e.target.value)} />
                   <datalist id={listId}>{(cityOptions || []).map((opt) => (<option key={`${opt.name}-${opt.latitude}-${opt.longitude}`} value={opt.name} />))}</datalist>
                </div>
                <div><label className="block text-xs text-slate-400 mb-1">Arrival</label><input type="date" className={INPUT_CLASS} value={row.arrival} onChange={(e) => setCityArrival(i, e.target.value)} /></div>
                <div><label className="block text-xs text-slate-400 mb-1">Departure</label><input type="date" className={INPUT_CLASS} value={row.departure} onChange={(e) => setCityDeparture(i, e.target.value)} /></div>
                <div className="flex pb-0.5"><button type="button" onClick={() => removeCity(i)} className="text-slate-400 hover:text-rose-500 transition p-2"><Icons.Trash className="w-4 h-4" /></button></div>
              </div>
            );
          })}
          <button type="button" onClick={addCity} className="text-xs font-medium text-[hsl(var(--brand))] hover:underline">+ Add another city</button>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Accommodation</label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-3">
          {ACCOMMODATION_OPTIONS.map((opt) => {
            const checked = (stop.accommodations || []).includes(opt);
            const id = `${stop.id}-accom-${opt.replace(/\s+/g, '-').toLowerCase()}`;
            return (<label key={opt} htmlFor={id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input id={id} type="checkbox" className={CHECKBOX_CLASS} checked={checked} onChange={() => toggleAccommodation(opt)} /><span>{opt}</span></label>);
          })}
        </div>
        {(stop.accommodations || []).includes('Other') && (
          <div className="mt-3"><input type="text" placeholder="Describe other accommodation..." className={INPUT_CLASS} value={stop.accommodationOther} onChange={(e) => onChange({ accommodationOther: e.target.value })} /></div>
        )}
      </div>

      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Activities / Exposures</h4>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
          <fieldset className="space-y-1">
            <legend className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Vector-borne</legend>
            <ExposureRow label="Mosquito bites" status={exp.mosquito} details={exp.mosquitoDetails} onToggle={(v) => onChange({ exposures: { ...exp, mosquito: v } })} onDetails={(v) => onChange({ exposures: { ...exp, mosquitoDetails: v } })} />
            <ExposureRow label="Tick bites" status={exp.tick} details={exp.tickDetails} onToggle={(v) => onChange({ exposures: { ...exp, tick: v } })} onDetails={(v) => onChange({ exposures: { ...exp, tickDetails: v } })} />
            <div className="space-y-1 pt-2">
              <label className="flex items-center gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" aria-hidden="true" />
                <span className="flex-1">Other vector</span>
                <div className="flex gap-1">
                   {['yes', 'no'].map((opt) => (
                      <button key={opt} type="button" onClick={() => onChange({ exposures: { ...exp, vectorOtherEnabled: opt === exp.vectorOtherEnabled ? 'unknown' : opt } })} className={classNames("px-2 py-0.5 text-xs border rounded transition-colors", exp.vectorOtherEnabled === opt ? (opt === 'yes' ? "bg-rose-100 border-rose-300 text-rose-800 font-medium" : "bg-emerald-100 border-emerald-300 text-emerald-800 font-medium") : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400")}>{cap(opt)}</button>
                   ))}
                </div>
              </label>
             {exp.vectorOtherEnabled === 'yes' && (<input type="text" placeholder="Please provide more details." className={INPUT_CLASS} value={exp.vectorOtherDetails} onChange={(e) => onChange({ exposures: { ...exp, vectorOtherDetails: e.target.value } })} />)}
            </div>
          </fieldset>
          <fieldset className="space-y-1">
            <legend className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Water / Environment</legend>
            <ExposureRow label="Freshwater contact" status={exp.freshwater} details={exp.freshwaterDetails} onToggle={(v) => onChange({ exposures: { ...exp, freshwater: v } })} onDetails={(v) => onChange({ exposures: { ...exp, freshwaterDetails: v } })} />
            <ExposureRow label="Visited caves or mines" status={exp.cavesMines} details={exp.cavesMinesDetails} onToggle={(v) => onChange({ exposures: { ...exp, cavesMines: v } })} onDetails={(v) => onChange({ exposures: { ...exp, cavesMinesDetails: v } })} placeholder="If yes, any contact with bats?" />
            <ExposureRow label="Rural / forest stay" status={exp.ruralForest} details={exp.ruralForestDetails} onToggle={(v) => onChange({ exposures: { ...exp, ruralForest: v } })} onDetails={(v) => onChange({ exposures: { ...exp, ruralForestDetails: v } })} />
            <ExposureRow label="Hiking in forest/woodlands" status={exp.hikingWoodlands} details={exp.hikingWoodlandsDetails} onToggle={(v) => onChange({ exposures: { ...exp, hikingWoodlands: v } })} onDetails={(v) => onChange({ exposures: { ...exp, hikingWoodlandsDetails: v } })} />
          </fieldset>
          <fieldset className="space-y-1">
            <legend className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Animal & Procedures</legend>
            <ExposureRow label="Animal contact" status={exp.animalContact} details={exp.animalContactDetails} onToggle={(v) => onChange({ exposures: { ...exp, animalContact: v } })} onDetails={(v) => onChange({ exposures: { ...exp, animalContactDetails: v } })} />
            <ExposureRow label="Animal bite / scratch" status={exp.animalBiteScratch} details={exp.animalBiteScratchDetails} onToggle={(v) => onChange({ exposures: { ...exp, animalBiteScratch: v } })} onDetails={(v) => onChange({ exposures: { ...exp, animalBiteScratchDetails: v } })} />
            <ExposureRow label="Bushmeat consumption" status={exp.bushmeat} details={exp.bushmeatDetails} onToggle={(v) => onChange({ exposures: { ...exp, bushmeat: v } })} onDetails={(v) => onChange({ exposures: { ...exp, bushmeatDetails: v } })} />
            <ExposureRow label="Needles / tattoos / piercings" status={exp.needlesTattoos} details={exp.needlesTattoosDetails} onToggle={(v) => onChange({ exposures: { ...exp, needlesTattoos: v } })} onDetails={(v) => onChange({ exposures: { ...exp, needlesTattoosDetails: v } })} />
            <ExposureRow label="Safari / wildlife viewing" status={exp.safariWildlife} details={exp.safariWildlifeDetails} onToggle={(v) => onChange({ exposures: { ...exp, safariWildlife: v } })} onDetails={(v) => onChange({ exposures: { ...exp, safariWildlifeDetails: v } })} />
          </fieldset>
          <fieldset className="space-y-1">
            <legend className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Food & Water</legend>
            <ExposureRow label="Street food" status={exp.streetFood} details={exp.streetFoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, streetFood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, streetFoodDetails: v } })} />
            <ExposureRow label="Drank untreated water" status={exp.untreatedWater} details={exp.untreatedWaterDetails} onToggle={(v) => onChange({ exposures: { ...exp, untreatedWater: v } })} onDetails={(v) => onChange({ exposures: { ...exp, untreatedWaterDetails: v } })} />
            <ExposureRow label="Undercooked food" status={exp.undercookedFood} details={exp.undercookedFoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, undercookedFood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, undercookedFoodDetails: v } })} />
            <ExposureRow label="Undercooked seafood" status={exp.undercookedSeafood} details={exp.undercookedSeafoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, undercookedSeafood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, undercookedSeafoodDetails: v } })} />
            <ExposureRow label="Unpasteurised milk" status={exp.unpasteurisedMilk} details={exp.unpasteurisedMilkDetails} onToggle={(v) => onChange({ exposures: { ...exp, unpasteurisedMilk: v } })} onDetails={(v) => onChange({ exposures: { ...exp, unpasteurisedMilkDetails: v } })} />
          </fieldset>
          <fieldset className="space-y-1 md:col-span-2">
            <legend className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Institutional / Social</legend>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-1">
              <ExposureRow label="Attended funerals" status={exp.funerals} details={exp.funeralsDetails} onToggle={(v) => onChange({ exposures: { ...exp, funerals: v } })} onDetails={(v) => onChange({ exposures: { ...exp, funeralsDetails: v } })} />
              <ExposureRow label="Sick contacts (including TB)" status={exp.sickContacts} details={exp.sickContactsDetails} onToggle={(v) => onChange({ exposures: { ...exp, sickContacts: v } })} onDetails={(v) => onChange({ exposures: { ...exp, sickContactsDetails: v } })} />
              <ExposureRow label="Healthcare facility contact" status={exp.healthcareFacility} details={exp.healthcareFacilityDetails} onToggle={(v) => onChange({ exposures: { ...exp, healthcareFacility: v } })} onDetails={(v) => onChange({ exposures: { ...exp, healthcareFacilityDetails: v } })} />
              <ExposureRow label="Prison contact" status={exp.prison} details={exp.prisonDetails} onToggle={(v) => onChange({ exposures: { ...exp, prison: v } })} onDetails={(v) => onChange({ exposures: { ...exp, prisonDetails: v } })} />
              <ExposureRow label="Refugee camp contact" status={exp.refugeeCamp} details={exp.refugeeCampDetails} onToggle={(v) => onChange({ exposures: { ...exp, refugeeCamp: v } })} onDetails={(v) => onChange({ exposures: { ...exp, refugeeCampDetails: v } })} />
              <ExposureRow label="Unprotected sex" status={exp.unprotectedSex} details={exp.unprotectedSexDetails} onToggle={(v) => onChange({ exposures: { ...exp, unprotectedSex: v } })} onDetails={(v) => onChange({ exposures: { ...exp, unprotectedSexDetails: v } })} />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Other exposure (free-text)</label>
              <input type="text" className={INPUT_CLASS} value={exp.otherText} onChange={(e) => onChange({ exposures: { ...exp, otherText: e.target.value } })} />
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

function LayoverCard({ layover, onChange, onRemove, innerRef, highlighted }) {
  const countryISO2 = useMemo(() => getIsoFromCountryName(layover.country), [layover.country]);
  const cityOptions = useMemo(() => { return countryISO2 ? (City.getCitiesOfCountry(countryISO2) || []) : []; }, [countryISO2]);

  return (
    <div ref={innerRef} className={classNames("rounded-xl border p-5 shadow-sm transition bg-slate-50/50 dark:bg-slate-900/20", highlighted ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10" : "border-slate-200 dark:border-slate-800")}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Icons.Plane className="w-4 h-4 text-slate-400" /> Layover
        </h4>
        <button type="button" onClick={onRemove} className={BTN_GHOST_DANGER}><Icons.Trash className="w-3.5 h-3.5" /> Remove</button>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div><CountryInput value={layover.country} onChange={(val) => { onChange({ country: val, city: "" }); }} /></div>
        <div className="w-full">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">City</label>
          <input type="text" list={`layover-city-options-${layover.id}`} placeholder="City..." className={INPUT_CLASS} value={layover.city || ""} onChange={(e) => onChange({ city: e.target.value })} />
          <datalist id={`layover-city-options-${layover.id}`}>{cityOptions.map((opt) => (<option key={`${opt.name}-${opt.latitude}-${opt.longitude}`} value={opt.name} />))}</datalist>
        </div>
        <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Start</label><input type="date" className={INPUT_CLASS} value={layover.start} onChange={(e) => onChange({ start: e.target.value })} /></div>
        <div><label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">End</label><input type="date" className={INPUT_CLASS} value={layover.end} onChange={(e) => onChange({ end: e.target.value })} /></div>
      </div>
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Left airport?</label>
          <select className={INPUT_CLASS} value={layover.leftAirport} onChange={(e) => onChange({ leftAirport: e.target.value })}><option value="no">No</option><option value="yes">Yes</option></select>
        </div>
        {layover.leftAirport === "yes" && (<div className="sm:col-span-2"><label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Activities</label><textarea rows={2} className={INPUT_CLASS} value={layover.activitiesText} onChange={(e) => onChange({ activitiesText: e.target.value })} /></div>)}
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  const id = useMemo(() => uid(), []);
  return (
    <label htmlFor={id} className="flex items-center gap-2 py-1 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
      <input id={id} type="checkbox" className={CHECKBOX_CLASS} checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function ExposureRow({ label, status, details, onToggle, onDetails, placeholder }) {
  const safeStatus = typeof status === 'boolean' ? (status ? 'yes' : 'unknown') : (status || 'unknown');
  return (
    <div className="py-1">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
           <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" aria-hidden="true" />
           {label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onToggle(safeStatus === 'yes' ? 'unknown' : 'yes')} className={classNames("px-2.5 py-1 text-xs font-medium border rounded-md transition-colors", safeStatus === 'yes' ? "bg-rose-100 border-rose-300 text-rose-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400")}>Yes</button>
          <button type="button" onClick={() => onToggle(safeStatus === 'no' ? 'unknown' : 'no')} className={classNames("px-2.5 py-1 text-xs font-medium border rounded-md transition-colors", safeStatus === 'no' ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400")}>No</button>
        </div>
      </div>
      {safeStatus === 'yes' && (<div className="mt-2"><input type="text" placeholder={placeholder || "Please provide details..."} className={INPUT_CLASS} value={details || ''} onChange={(e) => onDetails(e.target.value)} /></div>)}
    </div>
  );
}

function TimelineVertical({ events }) {
  const Node = () => (<span className={classNames("relative z-10 inline-block h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-950", NODE_COLOR)} aria-hidden="true" />);
  const layoversByStop = useMemo(() => {
    const map = new Map();
    for (const ev of events || []) {
      if (ev.type !== "layover" || !ev.anchorStopId) continue;
      const id = ev.anchorStopId;
      const pos = ev.position || "between";
      if (!map.has(id)) map.set(id, { "before-stop": [], between: [], "after-stop": [] });
      map.get(id)[pos].push(ev.layover);
    }
    return map;
  }, [events]);

  const LayoverRows = ({ l }) => (
    <>
      <div className="col-[1] relative h-8 z-10"><span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"><span className="relative z-10 inline-block h-2 w-2 rounded-full ring-4 ring-white dark:ring-slate-950 bg-slate-300 dark:bg-slate-700" aria-hidden="true" /></span></div>
      <div className="col-[2] h-8 flex items-center gap-3"><strong className="tabular-nums text-sm">{formatDMY(l.start)}</strong><span className="text-xs text-slate-500 uppercase tracking-wide">Layover start</span></div>
      <div className="col-[1]" aria-hidden="true" />
      <div className="col-[2]"><div className="my-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 shadow-sm">{(l.city ? `${l.city}, ` : "") + (l.country || "")}{l.leftAirport === "yes" && l.activitiesText ? ` · ${l.activitiesText}` : ""}</div></div>
      <div className="col-[1] relative h-8 z-10"><span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"><span className="relative z-10 inline-block h-2 w-2 rounded-full ring-4 ring-white dark:ring-slate-950 bg-slate-300 dark:bg-slate-700" aria-hidden="true" /></span></div>
      <div className="col-[2] h-8 flex items-center gap-3"><strong className="tabular-nums text-sm">{formatDMY(l.end)}</strong><span className="text-xs text-slate-500 uppercase tracking-wide">Layover end</span></div>
    </>
  );

  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute left-[28px] top-0 bottom-0 z-0 border-l-2 border-slate-200 dark:border-slate-800" />
      <ol className="grid" style={{ gridTemplateColumns: "56px 1fr", rowGap: "0px" }}>
        {(events || []).map((ev, idx) => {
          if (ev.type !== "stop") return null;
          const it = ev.stop;
          return (
            <li key={`stop-${it.id}-${idx}`} className="contents">
              <div className="col-[1] relative h-10 z-10"><span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"><Node /></span></div>
              <div className="col-[2] h-10 flex items-center"><div className="flex items-center gap-3"><strong className="tabular-nums font-bold text-slate-900 dark:text-slate-100">{formatDMY(it.arrival)}</strong>{it.isFirstInTrip && (<span className="text-xs text-slate-500 uppercase tracking-wide">— {it.tripOriginCity || it.tripOriginCountry ? `Departure from ${[it.tripOriginCity, it.tripOriginCountry].filter(Boolean).join(", ")}` : "Departure"}</span>)}</div></div>
              {it.isFirstInTrip && (
                <div className="col-[2] mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  {it.tripPurpose ? (<div><span className="font-semibold text-slate-900 dark:text-slate-100">Purpose:</span> {it.tripPurpose}</div>) : null}
                  <div><span className="font-semibold text-slate-900 dark:text-slate-100">Malaria:</span> {(() => { const m = it.tripMalaria || {}; if (m.indication === "Taken") { const drug = m.drug && m.drug !== "None" ? m.drug : "Taken"; return m.adherence ? `${drug}. Adherence: ${m.adherence}` : drug; } if (m.indication === "Not taken") return "Not taken"; return "Not indicated"; })()}</div>
                  <div><span className="font-semibold text-slate-900 dark:text-slate-100">Vaccines:</span> {(() => { const arr = Array.isArray(it.tripVaccines) ? it.tripVaccines : []; const hasOther = arr.includes("Other"); const base = (hasOther ? arr.filter((v) => v !== "Other") : arr).join(", "); const otherText = (it.tripVaccinesOther || "").trim(); if (hasOther && otherText) { return base ? `${base}, Other: ${otherText}` : `Other: ${otherText}`; } return base ? (hasOther ? `${base}, Other` : base) : hasOther ? "Other" : "None"; })()}</div>
                  {it.tripCompanions && (<>{it.tripCompanions.group === "Alone" ? (<div><span className="font-semibold text-slate-900 dark:text-slate-100">Travelled alone.</span></div>) : (<><div><span className="font-semibold text-slate-900 dark:text-slate-100">With:</span> {it.tripCompanions.group === "Other" ? it.tripCompanions.otherText || "Other" : it.tripCompanions.group || "—"}</div><div><span className="font-semibold text-slate-900 dark:text-slate-100">Well:</span> {it.tripCompanions.companionsWell === "yes" ? "Yes" : it.tripCompanions.companionsWell === "no" ? "No" + (it.tripCompanions.companionsUnwellDetails?.trim() ? ` — ${it.tripCompanions.companionsUnwellDetails.trim()}` : "") : "Unknown"}</div></>)}</>)}
                </div>
              )}
              {(layoversByStop.get(it.id)?.["before-stop"] || []).map((l) => (<LayoverRows key={`layover-before-${l.id}`} l={l} />))}
              <div className="col-[1]" aria-hidden="true" />
              <div className="col-[2] pb-6">
                <div className="relative z-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100" title={it.country || it.label}>{it.country || it.label || "—"}</h3>
                  {it.cities && it.cities.length > 0 && (<div className="mt-1 space-y-0.5 text-sm text-slate-600 dark:text-slate-400">{it.cities.map((c, i) => { const obj = typeof c === "string" ? { name: c } : c || {}; const nm = obj.name || ""; const a = obj.arrival ? formatDMY(obj.arrival) : ""; const d = obj.departure ? formatDMY(obj.departure) : ""; const datePart = a || d ? ` (${a || "—"} to ${d || "—"})` : ""; if (!nm) return null; return (<div key={i}>{nm}{datePart}</div>); })}</div>)}
                  <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-sm"><span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">Accommodation</span> {it.accommodations?.length ? it.accommodations.includes("Other") && it.accommodationOther ? [...it.accommodations.filter((a) => a !== "Other"), `Other: ${it.accommodationOther}`].join(", ") : it.accommodations.join(", ") : "—"}</div>
                    <div className="text-sm sm:col-span-2 mt-2"><span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">Exposures</span> {(() => { const { positives, negatives } = exposureBullets(it.exposures); if (!positives.length && !negatives.length) return "—"; return (<div>{positives.length > 0 && (<ul className="list-disc pl-5 space-y-1 mb-2">{positives.map(({ label, details }, i) => (<li key={i} className="text-slate-700 dark:text-slate-300">{details ? <span>{label} <span className="text-slate-400">—</span> {details}</span> : label}</li>))}</ul>)}{negatives.length > 0 && (<div><div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-3 mb-1">No exposures to</div><ul className="list-disc pl-5 text-slate-500">{negatives.map((label, i) => (<li key={i}>{label}</li>))}</ul></div>)}</div>); })()}</div>
                  </div>
                </div>
              </div>
              {(layoversByStop.get(it.id)?.between || []).map((l) => (<LayoverRows key={`layover-between-${l.id}`} l={l} />))}
              {it.isLastInTrip && (layoversByStop.get(it.id)?.["after-stop"] || []).map((l) => (<LayoverRows key={`layover-after-${l.id}`} l={l} />))}
              <div className="col-[1] relative h-10 z-10"><span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"><Node /></span></div>
              <div className="col-[2] h-10 flex items-center gap-3"><strong className="tabular-nums font-bold text-slate-900 dark:text-slate-100">{formatDMY(it.departure)}</strong>{it.isLastInTrip && (<span className="text-xs text-slate-500 uppercase tracking-wide">— {it.tripOriginCity || it.tripOriginCountry ? `Arrival to ${[it.tripOriginCity, it.tripOriginCountry].filter(Boolean).join(", ")}` : "Arrival"}</span>)}</div>
            </li>
          );
        })}
      </ol>
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

    { const m = tripObj.malaria || { indication: "Not indicated", drug: "None", adherence: "" }; let malariaText; if (m.indication === "Taken") { const drug = m.drug && m.drug !== "None" ? m.drug : "Taken"; malariaText = m.adherence ? `${drug}. Adherence: ${m.adherence}` : drug; } else if (m.indication === "Not taken") { malariaText = "Not taken"; } else { malariaText = "Not indicated"; } html.push(`<div>Malaria prophylaxis: ${escapeHtml(malariaText)}</div>`); text.push(`Malaria prophylaxis: ${malariaText}`); }
    { const vaccinesArr = Array.isArray(tripObj.vaccines) ? tripObj.vaccines : []; const hasOther = vaccinesArr.includes("Other"); const baseList = hasOther ? vaccinesArr.filter((v) => v !== "Other") : vaccinesArr; let vaccinesDisplay = baseList.join(", "); const otherText = (tripObj.vaccinesOther || "").trim(); if (hasOther && otherText) { vaccinesDisplay = vaccinesDisplay ? `${vaccinesDisplay}, Other: ${otherText}` : `Other: ${otherText}`; } else if (hasOther) { vaccinesDisplay = vaccinesDisplay ? `${vaccinesDisplay}, Other` : "Other"; } html.push(`<div>Pre-travel vaccinations: ${vaccinesDisplay ? escapeHtml(vaccinesDisplay) : "None"}</div>`); text.push(`Pre-travel vaccinations: ${vaccinesDisplay || "None"}`); }

    { const cmp = state.companions || {}; if (cmp.group === "Alone") { html.push(`<div>Travelled alone.</div>`); text.push(`Travelled alone.`); } else { const groupStr = cmp.group === "Other" ? cmp.otherText || "Other" : cmp.group || "—"; html.push(`<div>Travelled with: ${escapeHtml(groupStr)}</div>`); text.push(`Travelled with: ${groupStr}`); const wellStr = cmp.companionsWell === "yes" ? "Yes" : cmp.companionsWell === "no" ? "No" : "Unknown"; if (cmp.companionsWell === "no") { const details = (cmp.companionsUnwellDetails || "").trim(); html.push(`<div>Are they well: No${details ? ` — ${escapeHtml(details)}` : ""}</div>`); text.push(`Are they well: No${details ? ` — ${details}` : ""}`); } else { html.push(`<div>Are they well: ${wellStr}</div>`); text.push(`Are they well: ${wellStr}`); } } }

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
