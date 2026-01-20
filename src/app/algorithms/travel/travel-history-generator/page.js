'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v15 (Phase 4: Fluid Inputs / Headless UI)
// Changes:
// - Replaced native inputs with Headless UI Combobox (Fuzzy Search for Country/City)
// - Replaced native selects with Headless UI Listbox (Custom Dropdowns)
// - Integrated "Manchester Tech" aesthetic (Shadows, Ring Focus, Fluid Animations)
// - Removed dependency on external CountryInput component (Self-contained)

import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { Combobox, Listbox, Transition } from '@headlessui/react';
import { clsx } from 'clsx'; // Utility for cleaner class logic

// ---- Data Sources ----
import { Country, City } from "country-state-city";

// --- Helpers ---
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
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white " +
  "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition";

const BTN_SECONDARY =
  "rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition";

const LINKISH_SECONDARY =
  "rounded-lg px-3 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition";

const NODE_COLOR = "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))]";

const INPUT_BASE = 
  "w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-slate-900 dark:text-slate-100 bg-transparent focus:ring-0";

const CONTAINER_BASE =
  "relative w-full cursor-default overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-left focus-within:border-[hsl(var(--brand))] focus-within:ring-1 focus-within:ring-[hsl(var(--brand))] sm:text-sm transition-all";

// ---- Icons ----
const Icons = {
  ChevronUpDown: (p) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-slate-400" {...p}><path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" /></svg>,
  Check: (p) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" {...p}><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
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

// ---- Custom UI Components (Headless UI) ----

// 1. Searchable Combobox (For Country / City)
function SearchableSelect({ value, onChange, options, placeholder }) {
  const [query, setQuery] = useState('');

  // Filter logic: fuzzy-ish (includes, case-insensitive)
  const filteredOptions =
    query === ''
      ? options
      : options.filter((opt) => {
          const str = typeof opt === 'string' ? opt : opt.name;
          return str.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, ''));
        });

  return (
    <Combobox value={value} onChange={onChange} nullable>
      <div className="relative mt-1">
        <div className={CONTAINER_BASE}>
          <Combobox.Input
            className={INPUT_BASE}
            displayValue={(item) => item || ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Icons.ChevronUpDown aria-hidden="true" />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-900 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {filteredOptions.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none px-4 py-2 text-slate-500">
                Nothing found.
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const label = typeof opt === 'string' ? opt : opt.name;
                const key = typeof opt === 'string' ? `${opt}-${idx}` : `${opt.name}-${opt.id || idx}`;
                return (
                  <Combobox.Option
                    key={key}
                    className={({ active }) =>
                      clsx(
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                        active ? 'bg-[hsl(var(--brand))] text-white' : 'text-slate-900 dark:text-slate-100'
                      )
                    }
                    value={label}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>
                          {label}
                        </span>
                        {selected ? (
                          <span
                            className={clsx(
                              'absolute inset-y-0 left-0 flex items-center pl-3',
                              active ? 'text-white' : 'text-[hsl(var(--brand))]'
                            )}
                          >
                            <Icons.Check aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
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

// 2. Simple Select Dropdown (For Malaria / Yes-No)
function SimpleSelect({ value, onChange, options }) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative mt-1">
        <Listbox.Button className={CONTAINER_BASE}>
          <span className="block truncate py-2 pl-3 pr-10">{value}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <Icons.ChevronUpDown aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-900 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {options.map((opt, idx) => (
              <Listbox.Option
                key={idx}
                className={({ active }) =>
                  clsx(
                    'relative cursor-default select-none py-2 pl-10 pr-4',
                    active ? 'bg-[hsl(var(--brand))] text-white' : 'text-slate-900 dark:text-slate-100'
                  )
                }
                value={opt}
              >
                {({ selected, active }) => (
                  <>
                    <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>
                      {opt}
                    </span>
                    {selected ? (
                      <span
                        className={clsx(
                          'absolute inset-y-0 left-0 flex items-center pl-3',
                          active ? 'text-white' : 'text-[hsl(var(--brand))]'
                        )}
                      >
                        <Icons.Check aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
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
    <main className="py-10 sm:py-14">
      <header className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Travel History Generator</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Build a clear, concise travel history. Provide as much information as possible.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={clearAll} className={BTN_SECONDARY}>Clear all</button>
        </div>
      </header>

      <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-4 text-amber-900 dark:text-amber-200 flex items-center gap-3">
        <span aria-hidden="true">⚠️</span>
        <p className="text-sm">Do not enter private or patient-identifiable information.</p>
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

      {/* Companions */}
      <section className="mt-10 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Companions</h2>
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
                    'rounded-md px-3 py-1.5 text-sm border-2 transition',
                    state.companions.group === opt
                      ? 'text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] border-transparent'
                      : 'border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] text-slate-700 dark:text-slate-200'
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
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
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
                      'rounded-md px-3 py-1.5 text-sm border-2 transition',
                      state.companions.companionsWell === val ? 'text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] border-transparent' : 'border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] text-slate-700 dark:text-slate-200'
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
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
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
      <section id="timeline-section" className="mt-10 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Timeline</h2>
        <TimelineVertical events={mergedEventsAllTrips} />
      </section>

      {/* Summary */}
      <section className="mt-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Travel History Summary</h2>
        <div className="text-sm text-slate-700 dark:text-slate-300">
          <div dangerouslySetInnerHTML={{ __html: summaryHtml }} />
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => navigator.clipboard.writeText(summaryTextPlain)} className={BTN_SECONDARY}>Copy summary</button>
        </div>
      </section>
    </main>
  );
}

// ===== Trip Card =====
function TripCard({
  trip, index, updateTrip, updateStop, addStop, removeStop, addLayover, updateLayover, removeLayover, removeTrip,
  highlight, setItemRef, innerRef
}) {
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
    <div ref={innerRef} className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Trip {index + 1}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => addStop(trip.id)} className={BTN_PRIMARY}>+ Add stop</button>
          <button type="button" onClick={() => addLayover(trip.id)} className={BTN_PRIMARY}>+ Add layover</button>
          <button type="button" onClick={() => removeTrip(trip.id)} className={BTN_SECONDARY}>Remove trip</button>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Travelling from</label>
        <div className="mt-2 grid sm:grid-cols-2 gap-4">
          <div>
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
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3">
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Purpose</label>
          <input 
            type="text" 
            placeholder="Work, VFR, tourism, humanitarian, etc." 
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" 
            value={trip.purpose} 
            onChange={(e) => updateTrip(trip.id, { purpose: e.target.value })} 
          />
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Pre-travel vaccinations</label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VACCINE_OPTIONS.map((v) => (<Checkbox key={v} label={v} checked={(trip.vaccines || []).includes(v)} onChange={() => toggleTripVaccine(v)} />))}
          </div>
          {(trip.vaccines || []).includes('Other') && (
            <div className="mt-2"><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Other vaccination(s)</label><input type="text" placeholder="Enter vaccine name(s)…" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={trip.vaccinesOther || ''} onChange={(e) => updateTrip(trip.id, { vaccinesOther: e.target.value })} /></div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Malaria prophylaxis</label>
          <div className="mt-2 grid sm:grid-cols-3 gap-2">
            <SimpleSelect 
              value={trip.malaria.indication} 
              onChange={(val) => setMalaria({ indication: val })} 
              options={MALARIA_INDICATIONS}
            />
            {trip.malaria.indication === 'Taken' && (
              <SimpleSelect 
                value={trip.malaria.drug} 
                onChange={(val) => setMalaria({ drug: val })} 
                options={MALARIA_DRUGS}
              />
            )}
            {trip.malaria.indication === 'Taken' && (
              <SimpleSelect 
                value={trip.malaria.adherence} 
                onChange={(val) => setMalaria({ adherence: val })} 
                options={['Good', 'Partial', 'Poor']}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {trip.stops.map((stop, sIdx) => (
          <StopCard key={stop.id} innerRef={setItemRef(stop.id)} stop={stop} index={sIdx} onChange={(patch) => updateStop(trip.id, stop.id, patch)} onRemove={() => removeStop(trip.id, stop.id)} highlighted={highlight.stopIds.has(stop.id)} />
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
    <div ref={innerRef} className={classNames("rounded-lg border p-4", highlighted ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10" : "border-slate-200 dark:border-slate-800")}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Stop {index + 1}</h3>
        <button type="button" onClick={onRemove} className={LINKISH_SECONDARY}>Remove stop</button>
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
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Arrival *</label><input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={stop.arrival} onChange={(e) => onChange({ arrival: e.target.value })} /></div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Departure *</label><input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={stop.departure} onChange={(e) => onChange({ departure: e.target.value })} /></div>
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
                  />
                </div>
                <input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={row.arrival} onChange={(e) => setCityArrival(i, e.target.value)} aria-label="City arrival date" />
                <input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={row.departure} onChange={(e) => setCityDeparture(i, e.target.value)} aria-label="City departure date" />
                <div className="flex"><button type="button" onClick={() => removeCity(i)} className="w-full sm:w-auto rounded-lg px-3 py-2 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition">Remove</button></div>
              </div>
            );
          })}
          <button type="button" onClick={addCity} className="rounded-lg px-3 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition">+ Add another city</button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Accommodation (select one or more)</label>
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
          <div className="mt-2"><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Other (describe)</label><input type="text" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={stop.accommodationOther} onChange={(e) => onChange({ accommodationOther: e.target.value })} /></div>
        )}
      </div>

      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Activities / Exposures</h4>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
          <fieldset className="space-y-1">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Vector-borne</legend>
            <ExposureRow label="Mosquito bites" status={exp.mosquito} details={exp.mosquitoDetails} onToggle={(v) => onChange({ exposures: { ...exp, mosquito: v } })} onDetails={(v) => onChange({ exposures: { ...exp, mosquitoDetails: v } })} />
            <ExposureRow label="Tick bites" status={exp.tick} details={exp.tickDetails} onToggle={(v) => onChange({ exposures: { ...exp, tick: v } })} onDetails={(v) => onChange({ exposures: { ...exp, tickDetails: v } })} />
            <div className="space-y-1 pt-2">
              <label className="flex items-center gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
                <span className="flex-1">Other vector</span>
                <div className="flex gap-1">
                   {['yes', 'no'].map((opt) => (
                      <button key={opt} type="button" onClick={() => onChange({ exposures: { ...exp, vectorOtherEnabled: opt === exp.vectorOtherEnabled ? 'unknown' : opt } })} className={classNames("px-2 py-0.5 text-xs border rounded transition-colors", exp.vectorOtherEnabled === opt ? (opt === 'yes' ? "bg-rose-100 border-rose-300 text-rose-800 font-medium" : "bg-emerald-100 border-emerald-300 text-emerald-800 font-medium") : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400")}>{cap(opt)}</button>
                   ))}
                </div>
              </label>
             {exp.vectorOtherEnabled === 'yes' && (<input type="text" placeholder="Please provide more details." className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={exp.vectorOtherDetails} onChange={(e) => onChange({ exposures: { ...exp, vectorOtherDetails: e.target.value } })} />)}
            </div>
          </fieldset>
          <fieldset className="space-y-1">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Water / Environment</legend>
            <ExposureRow label="Freshwater contact" status={exp.freshwater} details={exp.freshwaterDetails} onToggle={(v) => onChange({ exposures: { ...exp, freshwater: v } })} onDetails={(v) => onChange({ exposures: { ...exp, freshwaterDetails: v } })} />
            <ExposureRow label="Visited caves or mines" status={exp.cavesMines} details={exp.cavesMinesDetails} onToggle={(v) => onChange({ exposures: { ...exp, cavesMines: v } })} onDetails={(v) => onChange({ exposures: { ...exp, cavesMinesDetails: v } })} placeholder="If yes, any contact with bats?" />
            <ExposureRow label="Rural / forest stay" status={exp.ruralForest} details={exp.ruralForestDetails} onToggle={(v) => onChange({ exposures: { ...exp, ruralForest: v } })} onDetails={(v) => onChange({ exposures: { ...exp, ruralForestDetails: v } })} />
            <ExposureRow label="Hiking in forest/woodlands" status={exp.hikingWoodlands} details={exp.hikingWoodlandsDetails} onToggle={(v) => onChange({ exposures: { ...exp, hikingWoodlands: v } })} onDetails={(v) => onChange({ exposures: { ...exp, hikingWoodlandsDetails: v } })} />
          </fieldset>
          <fieldset className="space-y-1">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Animal & Procedures</legend>
            <ExposureRow label="Animal contact" status={exp.animalContact} details={exp.animalContactDetails} onToggle={(v) => onChange({ exposures: { ...exp, animalContact: v } })} onDetails={(v) => onChange({ exposures: { ...exp, animalContactDetails: v } })} />
            <ExposureRow label="Animal bite / scratch" status={exp.animalBiteScratch} details={exp.animalBiteScratchDetails} onToggle={(v) => onChange({ exposures: { ...exp, animalBiteScratch: v } })} onDetails={(v) => onChange({ exposures: { ...exp, animalBiteScratchDetails: v } })} />
            <ExposureRow label="Bushmeat consumption" status={exp.bushmeat} details={exp.bushmeatDetails} onToggle={(v) => onChange({ exposures: { ...exp, bushmeat: v } })} onDetails={(v) => onChange({ exposures: { ...exp, bushmeatDetails: v } })} />
            <ExposureRow label="Needles / tattoos / piercings" status={exp.needlesTattoos} details={exp.needlesTattoosDetails} onToggle={(v) => onChange({ exposures: { ...exp, needlesTattoos: v } })} onDetails={(v) => onChange({ exposures: { ...exp, needlesTattoosDetails: v } })} />
            <ExposureRow label="Safari / wildlife viewing" status={exp.safariWildlife} details={exp.safariWildlifeDetails} onToggle={(v) => onChange({ exposures: { ...exp, safariWildlife: v } })} onDetails={(v) => onChange({ exposures: { ...exp, safariWildlifeDetails: v } })} />
          </fieldset>
          <fieldset className="space-y-1">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Food & Water</legend>
            <ExposureRow label="Street food" status={exp.streetFood} details={exp.streetFoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, streetFood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, streetFoodDetails: v } })} />
            <ExposureRow label="Drank untreated water" status={exp.untreatedWater} details={exp.untreatedWaterDetails} onToggle={(v) => onChange({ exposures: { ...exp, untreatedWater: v } })} onDetails={(v) => onChange({ exposures: { ...exp, untreatedWaterDetails: v } })} />
            <ExposureRow label="Undercooked food" status={exp.undercookedFood} details={exp.undercookedFoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, undercookedFood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, undercookedFoodDetails: v } })} />
            <ExposureRow label="Undercooked seafood" status={exp.undercookedSeafood} details={exp.undercookedSeafoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, undercookedSeafood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, undercookedSeafoodDetails: v } })} />
            <ExposureRow label="Unpasteurised milk" status={exp.unpasteurisedMilk} details={exp.unpasteurisedMilkDetails} onToggle={(v) => onChange({ exposures: { ...exp, unpasteurisedMilk: v } })} onDetails={(v) => onChange({ exposures: { ...exp, unpasteurisedMilkDetails: v } })} />
          </fieldset>
          <fieldset className="space-y-1 md:col-span-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Institutional / Social</legend>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
              <ExposureRow label="Attended funerals" status={exp.funerals} details={exp.funeralsDetails} onToggle={(v) => onChange({ exposures: { ...exp, funerals: v } })} onDetails={(v) => onChange({ exposures: { ...exp, funeralsDetails: v } })} />
              <ExposureRow label="Sick contacts (including TB)" status={exp.sickContacts} details={exp.sickContactsDetails} onToggle={(v) => onChange({ exposures: { ...exp, sickContacts: v } })} onDetails={(v) => onChange({ exposures: { ...exp, sickContactsDetails: v } })} />
              <ExposureRow label="Healthcare facility contact" status={exp.healthcareFacility} details={exp.healthcareFacilityDetails} onToggle={(v) => onChange({ exposures: { ...exp, healthcareFacility: v } })} onDetails={(v) => onChange({ exposures: { ...exp, healthcareFacilityDetails: v } })} />
              <ExposureRow label="Prison contact" status={exp.prison} details={exp.prisonDetails} onToggle={(v) => onChange({ exposures: { ...exp, prison: v } })} onDetails={(v) => onChange({ exposures: { ...exp, prisonDetails: v } })} />
              <ExposureRow label="Refugee camp contact" status={exp.refugeeCamp} details={exp.refugeeCampDetails} onToggle={(v) => onChange({ exposures: { ...exp, refugeeCamp: v } })} onDetails={(v) => onChange({ exposures: { ...exp, refugeeCampDetails: v } })} />
              <ExposureRow label="Unprotected sex" status={exp.unprotectedSex} details={exp.unprotectedSexDetails} onToggle={(v) => onChange({ exposures: { ...exp, unprotectedSex: v } })} onDetails={(v) => onChange({ exposures: { ...exp, unprotectedSexDetails: v } })} />
            </div>
            <div className="mt-3">
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Other exposure (free-text)</label>
              <input type="text" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={exp.otherText} onChange={(e) => onChange({ exposures: { ...exp, otherText: e.target.value } })} />
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
           />
        </div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Start</label><input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={layover.start} onChange={(e) => onChange({ start: e.target.value })} /></div>
        <div><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">End</label><input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={layover.end} onChange={(e) => onChange({ end: e.target.value })} /></div>
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
        {layover.leftAirport === "yes" && (<div className="sm:col-span-2"><label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Please describe any activities undertaken</label><textarea rows={3} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={layover.activitiesText} onChange={(e) => onChange({ activitiesText: e.target.value })} /></div>)}
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  const id = useMemo(() => uid(), []);
  return (
    <label htmlFor={id} className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
      <input id={id} type="checkbox" className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700 text-[hsl(var(--brand))] focus:ring-[hsl(var(--brand))]" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
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
           <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
           {label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onToggle(safeStatus === 'yes' ? 'unknown' : 'yes')} className={classNames("px-2 py-0.5 text-xs border rounded transition-colors", safeStatus === 'yes' ? "bg-rose-100 border-rose-300 text-rose-800 font-medium" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400")}>Yes</button>
          <button type="button" onClick={() => onToggle(safeStatus === 'no' ? 'unknown' : 'no')} className={classNames("px-2 py-0.5 text-xs border rounded transition-colors", safeStatus === 'no' ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-medium" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400")}>No</button>
        </div>
      </div>
      {safeStatus === 'yes' && (<div className="mt-1"><input type="text" placeholder={placeholder || "Please provide details..."} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]" value={details || ''} onChange={(e) => onDetails(e.target.value)} /></div>)}
    </div>
  );
}

function TimelineVertical({ events }) {
  const Node = () => (<span className={classNames("relative z-10 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900", NODE_COLOR)} aria-hidden="true" />);
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
      <div className="col-[1] relative h-6 z-10"><span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"><span className="relative z-10 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-400 dark:bg-slate-600" aria-hidden="true" /></span></div>
      <div className="col-[2] h-6 flex items-center gap-3"><strong className="tabular-nums">{formatDMY(l.start)}</strong><span className="text-xs text-slate-500">Layover start</span></div>
      <div className="col-[1]" aria-hidden="true" />
      <div className="col-[2]"><div className="mt-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">{(l.city ? `${l.city}, ` : "") + (l.country || "")}{l.leftAirport === "yes" && l.activitiesText ? ` · ${l.activitiesText}` : ""}</div></div>
      <div className="col-[1] relative h-6 z-10"><span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"><span className="relative z-10 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-400 dark:bg-slate-600" aria-hidden="true" /></span></div>
      <div className="col-[2] h-6 flex items-center gap-3"><strong className="tabular-nums">{formatDMY(l.end)}</strong><span className="text-xs text-slate-500">Layover end</span></div>
    </>
  );

  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute left-[36px] top-0 bottom-0 z-0 border-l-2 border-dashed border-slate-300 dark:border-slate-600" />
      <ol className="grid" style={{ gridTemplateColumns: "72px 1fr", rowGap: "12px" }}>
        {(events || []).map((ev, idx) => {
          if (ev.type !== "stop") return null;
          const it = ev.stop;
          return (
            <li key={`stop-${it.id}-${idx}`} className="contents">
              <div className="col-[1] relative h-6 z-10"><span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"><Node /></span></div>
              <div className="col-[2] h-6 flex items-center"><div className="flex items-center gap-3"><strong className="tabular-nums">{formatDMY(it.arrival)}</strong>{it.isFirstInTrip && (<span className="text-sm text-slate-600 dark:text-slate-300">— {it.tripOriginCity || it.tripOriginCountry ? `Departure from ${[it.tripOriginCity, it.tripOriginCountry].filter(Boolean).join(", ")}` : "Departure"}</span>)}</div></div>
              {it.isFirstInTrip && (
                <div className="col-[2] mt-1 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
                  {it.tripPurpose ? (<div><span className="font-semibold">Purpose:</span> {it.tripPurpose}</div>) : null}
                  <div><span className="font-semibold">Malaria prophylaxis:</span> {(() => { const m = it.tripMalaria || {}; if (m.indication === "Taken") { const drug = m.drug && m.drug !== "None" ? m.drug : "Taken"; return m.adherence ? `${drug}. Adherence: ${m.adherence}` : drug; } if (m.indication === "Not taken") return "Not taken"; return "Not indicated"; })()}</div>
                  <div><span className="font-semibold">Vaccinations:</span> {(() => { const arr = Array.isArray(it.tripVaccines) ? it.tripVaccines : []; const hasOther = arr.includes("Other"); const base = (hasOther ? arr.filter((v) => v !== "Other") : arr).join(", "); const otherText = (it.tripVaccinesOther || "").trim(); if (hasOther && otherText) { return base ? `${base}, Other: ${otherText}` : `Other: ${otherText}`; } return base ? (hasOther ? `${base}, Other` : base) : hasOther ? "Other" : "None"; })()}</div>
                  {it.tripCompanions && (<>{it.tripCompanions.group === "Alone" ? (<div><span className="font-semibold">Travelled alone.</span></div>) : (<><div><span className="font-semibold">Travelled with:</span> {it.tripCompanions.group === "Other" ? it.tripCompanions.otherText || "Other" : it.tripCompanions.group || "—"}</div><div><span className="font-semibold">Are they well:</span> {it.tripCompanions.companionsWell === "yes" ? "Yes" : it.tripCompanions.companionsWell === "no" ? "No" + (it.tripCompanions.companionsUnwellDetails?.trim() ? ` — ${it.tripCompanions.companionsUnwellDetails.trim()}` : "") : "Unknown"}</div></>)}</>)}
                </div>
              )}
              {(layoversByStop.get(it.id)?.["before-stop"] || []).map((l) => (<LayoverRows key={`layover-before-${l.id}`} l={l} />))}
              <div className="col-[1]" aria-hidden="true" />
              <div className="col-[2]">
                <div className="relative z-0 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100" title={it.country || it.label}>{it.country || it.label || "—"}</h3>
                  {it.cities && it.cities.length > 0 && (<div className="mt-1 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">{it.cities.map((c, i) => { const obj = typeof c === "string" ? { name: c } : c || {}; const nm = obj.name || ""; const a = obj.arrival ? formatDMY(obj.arrival) : ""; const d = obj.departure ? formatDMY(obj.departure) : ""; const datePart = a || d ? ` (${a || "—"} to ${d || "—"})` : ""; if (!nm) return null; return (<div key={i}>{nm}{datePart}</div>); })}</div>)}
                  <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                    <div className="text-sm"><span className="font-medium">Accommodation:</span> {it.accommodations?.length ? it.accommodations.includes("Other") && it.accommodationOther ? [...it.accommodations.filter((a) => a !== "Other"), `Other: ${it.accommodationOther}`].join(", ") : it.accommodations.join(", ") : "—"}</div>
                    <div className="text-sm sm:col-span-2"><span className="font-medium">Exposures:</span> {(() => { const { positives, negatives } = exposureBullets(it.exposures); if (!positives.length && !negatives.length) return "—"; return (<div className="mt-1 space-y-2">{positives.length > 0 && (<ul className="list-disc pl-5">{positives.map(({ label, details }, i) => (<li key={i} className="text-sm">{details ? `${label} — ${details}` : label}</li>))}</ul>)}{negatives.length > 0 && (<div className="mt-2"><div className="font-medium">No exposures to:</div><ul className="list-disc pl-5">{negatives.map((label, i) => (<li key={i} className="text-sm">{label}</li>))}</ul></div>)}</div>); })()}</div>
                  </div>
                </div>
              </div>
              {(layoversByStop.get(it.id)?.between || []).map((l) => (<LayoverRows key={`layover-between-${l.id}`} l={l} />))}
              {it.isLastInTrip && (layoversByStop.get(it.id)?.["after-stop"] || []).map((l) => (<LayoverRows key={`layover-after-${l.id}`} l={l} />))}
              <div className="col-[1] relative h-6 z-10"><span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"><Node /></span></div>
              <div className="col-[2] h-6 flex items-center gap-3"><strong className="tabular-nums">{formatDMY(it.departure)}</strong>{it.isLastInTrip && (<span className="text-sm text-slate-600 dark:text-slate-300">— {it.tripOriginCity || it.tripOriginCountry ? `Arrival to ${[it.tripOriginCity, it.tripOriginCountry].filter(Boolean).join(", ")}` : "Arrival"}</span>)}</div>
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
