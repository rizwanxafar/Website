'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v10.1 (Refined Exposure Logic)
// Changes:
// - "No" button is now Green (Safe/Negative)
// - Summaries & Timeline now split "Exposures" and "No exposures to" into separate lists

import { useEffect, useMemo, useRef, useState } from 'react';

// ---- Minimal countries stub for datalist (replace with canonical dataset later) ----
import CountryInput from "@/components/inputs/CountryInput";
import { Country, City } from "country-state-city";

// --- country-state-city helpers (cache + name→ISO lookup) ---
const CSC_COUNTRIES = Country.getAllCountries(); // [{ name, isoCode, ... }]

function getIsoFromCountryName(name) {
  if (!name) return "";
  const q = name.trim().toLowerCase();

  // 1) direct case-insensitive name match
  let hit = CSC_COUNTRIES.find(c => c.name.toLowerCase() === q);
  if (hit) return hit.isoCode;

  // 2) soft match: strip punctuation/diacritics and compare again
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
  'Yellow fever',
  'Hepatitis A',
  'Hepatitis B',
  'Typhoid',
  'Meningitis ACWY',
  'Rabies (pre-exposure)',
  'Cholera (oral)',
  'Japanese encephalitis (JE)',
  'Tick-borne encephalitis (TBE)',
  'Other',
];

const MALARIA_DRUGS = ['None', 'Atovaquone/Proguanil', 'Doxycycline', 'Mefloquine', 'Chloroquine'];
const MALARIA_INDICATIONS = ['Not indicated', 'Taken', 'Not taken'];

// ---- Theme helpers ----
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

// ---- Helpers ----
const uid = () => Math.random().toString(36).slice(2, 9);
const classNames = (...parts) => parts.filter(Boolean).join(' ');

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Format outputs as DD/MM/YYYY (inputs remain native yyyy-mm-dd)
const formatDMY = (dateStr) => {
  const d = parseDate(dateStr);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Capitalise first letter (leave rest as-is)
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Overlap check (same-day edges allowed)
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  const aS = parseDate(aStart), aE = parseDate(aEnd), bS = parseDate(bStart), bE = parseDate(bEnd);
  if (!aS || !aE || !bS || !bE) return false;
  return aS < bE && bS < aE; // edges equal are allowed
}

// ---- Initial State ----
const emptyStop = () => ({
  id: uid(),
  country: '',
  cities: [{ name: '', arrival: '', departure: '' }], // multiple cities per stop (object shape)
  arrival: '',
  departure: '',
  accommodations: [], // multiple accommodation types
  accommodationOther: '',

  // Exposures with per-exposure details
  exposures: {
    // Vector
    mosquito: 'unknown', mosquitoDetails: '',         // Mosquito bites
    tick: 'unknown', tickDetails: '',                 // Tick bites
    vectorOtherEnabled: 'unknown', vectorOtherDetails: '',
    // Environment
    freshwater: 'unknown', freshwaterDetails: '',
    cavesMines: 'unknown', cavesMinesDetails: '',     // Visited caves/mines
    ruralForest: 'unknown', ruralForestDetails: '',   // Rural / forest stay
    hikingWoodlands: 'unknown', hikingWoodlandsDetails: '', // Hiking in forest/bush/woodlands
    // Animal / procedures
    animalContact: 'unknown', animalContactDetails: '',
    animalBiteScratch: 'unknown', animalBiteScratchDetails: '',
    bushmeat: 'unknown', bushmeatDetails: '',         // Bushmeat consumption
    needlesTattoos: 'unknown', needlesTattoosDetails: '',
    safariWildlife: 'unknown', safariWildlifeDetails: '',
    // Food / water
    streetFood: 'unknown', streetFoodDetails: '',
    untreatedWater: 'unknown', untreatedWaterDetails: '',
    undercookedFood: 'unknown', undercookedFoodDetails: '',
    undercookedSeafood: 'unknown', undercookedSeafoodDetails: '',
    unpasteurisedMilk: 'unknown', unpasteurisedMilkDetails: '',
    // Social / institutional
    funerals: 'unknown', funeralsDetails: '',         // Attended funerals
    largeGatherings: 'unknown', largeGatheringsDetails: '',
    sickContacts: 'unknown', sickContactsDetails: '', // Sick contacts (incl. TB)
    healthcareFacility: 'unknown', healthcareFacilityDetails: '',
    prison: 'unknown', prisonDetails: '',
    refugeeCamp: 'unknown', refugeeCampDetails: '',
    unprotectedSex: 'unknown', unprotectedSexDetails: '',
    // Misc
    otherText: '',
  },
});

const emptyLayover = (tripId) => ({
  id: uid(), tripId, country: '', city: '', start: '', end: '', leftAirport: 'no',
  activitiesText: '', // free text if leftAirport = yes
});

const emptyTrip = () => ({
  id: uid(),
  purpose: '',
  originCountry: '',
  originCity: '',
  // Trip-level vaccines & malaria
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
    companionsWell: 'unknown',  // yes | no | unknown
    companionsUnwellDetails: '',
  },
};

// ===== Shared chronology builder (used by Timeline and Summary) =====
function buildTripEvents(trip, companions) {
  // Sort stops by arrival
  const stopsSorted = [...trip.stops].sort((a, b) => (parseDate(a.arrival) - parseDate(b.arrival)));
  const layoversSorted = [...trip.layovers].sort((a, b) => (parseDate(a.start) - parseDate(b.start)));

  const events = [];

  if (stopsSorted.length === 0) {
    // No stops: just layovers in start-time order
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

    if (eTime && eTime <= parseDate(firstStop.arrival)) {
      beforeFirst.push(l);
      continue;
    }
    if (sTime && sTime >= parseDate(lastStop.departure)) {
      afterLast.push(l);
      continue;
    }

    let placed = false;
    for (let i = 0; i < stopsSorted.length - 1; i++) {
      const depI = parseDate(stopsSorted[i].departure);
      const arrIp1 = parseDate(stopsSorted[i + 1].arrival);
      if (depI && arrIp1 && sTime && eTime && depI <= sTime && eTime <= arrIp1) {
        betweenByIndex[i].push(l);
        placed = true;
        break;
      }
    }
    if (!placed) {
      (sTime && sTime < parseDate(firstStop.arrival) ? beforeFirst : afterLast).push(l);
    }
  }

   // Emit with anchors so Timeline can place layovers near the correct stop
  const firstStopId = firstStop.id;
  const lastStopId = lastStop.id;

  // Sort groups
  beforeFirst.sort((a, b) => (parseDate(a.end) - parseDate(b.end)));
  afterLast.sort((a, b) => (parseDate(a.start) - parseDate(b.start)));

  stopsSorted.forEach((s, i) => {
    const isFirstInTrip = s.id === firstStopId;
    const isLastInTrip = s.id === lastStopId;
    events.push({
      type: 'stop',
      date: parseDate(s.arrival),
      stop: {
        ...s,
        isFirstInTrip,
        isLastInTrip,
        tripPurpose: trip.purpose,
        tripVaccines: trip.vaccines || [],
        tripVaccinesOther: trip.vaccinesOther || '',
        tripMalaria: trip.malaria || { indication: 'Not indicated', drug: 'None', adherence: '' },
        tripCompanions: companions || null,
        tripOriginCountry: trip.originCountry || '',
        tripOriginCity: trip.originCity || '',
      },
    });

    // Attach layovers that belong *before the first stop's card*
    if (i === 0 && beforeFirst.length) {
      beforeFirst.forEach((l) =>
        events.push({
          type: 'layover',
          date: parseDate(l.start),
          layover: l,
          anchorStopId: s.id,
          position: 'before-stop',
        })
      );
    }

    // Layovers between this stop and the next (render *after* this stop's card)
    if (i < betweenByIndex.length) {
      const group = betweenByIndex[i].sort((a, b) => (parseDate(a.start) - parseDate(b.start)));
      group.forEach((l) =>
        events.push({
          type: 'layover',
          date: parseDate(l.start),
          layover: l,
          anchorStopId: s.id,
          position: 'between',
        })
      );
    }

    // Attach layovers that belong *after the last stop's card*
    if (isLastInTrip && afterLast.length) {
      afterLast.forEach((l) =>
        events.push({
          type: 'layover',
          date: parseDate(l.start),
          layover: l,
          anchorStopId: s.id,
          position: 'after-stop',
        })
      );
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

  // Warn on refresh/close if there is any entered data (memory-only mode)
useEffect(() => {
  const hasData = state.trips.some(t => t.stops.length > 0 || t.layovers.length > 0);

  const onBeforeUnload = (e) => {
    if (!hasData) return;
    e.preventDefault();
    e.returnValue = "";
  };

  if (hasData) {
    window.addEventListener("beforeunload", onBeforeUnload);
  }

  return () => {
    window.removeEventListener("beforeunload", onBeforeUnload);
  };
}, [state.trips]);

  // Validation: strict overlaps, same-day edges allowed
  useEffect(() => {
    const list = [];
    const stopIds = new Set();
    const layIds = new Set();

    state.trips.forEach((trip, tIdx) => {
      // Stop date order sanity
      trip.stops.forEach((s, sIdx) => {
        if (s.arrival && s.departure) {
          const a = parseDate(s.arrival), d = parseDate(s.departure);
          if (a && d && a > d) {
            list.push({ level: 'error', msg: `Trip ${tIdx + 1}, Stop ${sIdx + 1}: Arrival is after departure.` });
            stopIds.add(s.id);
          }
        }
      });

      // Stop vs Stop
      for (let i = 0; i < trip.stops.length; i++) {
        for (let j = i + 1; j < trip.stops.length; j++) {
          const A = trip.stops[i], B = trip.stops[j];
          if (rangesOverlap(A.arrival, A.departure, B.arrival, B.departure)) {
            list.push({ level: 'error', msg: `Trip ${tIdx + 1}: Stops ${i + 1} and ${j + 1} overlap; adjust dates.` });
            stopIds.add(A.id); stopIds.add(B.id);
          }
        }
      }

      // Layover vs Layover
      for (let i = 0; i < trip.layovers.length; i++) {
        for (let j = i + 1; j < trip.layovers.length; j++) {
          const A = trip.layovers[i], B = trip.layovers[j];
          if (rangesOverlap(A.start, A.end, B.start, B.end)) {
            list.push({ level: 'error', msg: `Trip ${tIdx + 1}: Layovers overlap; adjust times.` });
            layIds.add(A.id); layIds.add(B.id);
          }
        }
      }

      // Layover vs Stop
      trip.layovers.forEach((L, li) => {
        trip.stops.forEach((S, si) => {
          if (rangesOverlap(L.start, L.end, S.arrival, S.departure)) {
            list.push({ level: 'error', msg: `Trip ${tIdx + 1}: Layover ${li + 1} overlaps Stop ${si + 1}; adjust dates.` });
            layIds.add(L.id); stopIds.add(S.id);
          }
        });
      });
    });

    setIssues(list);
    setHighlight({ stopIds, layoverIds: layIds });
  }, [state.trips]);

  // Auto-scroll to newly added element
  useEffect(() => {
    if (!pendingScrollId) return;
    const el = itemRefs.current.get(pendingScrollId);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const t = setTimeout(() => setPendingScrollId(null), 600);
    return () => clearTimeout(t);
  }, [pendingScrollId]);

  // Derived: merged chronology across all trips for the timeline component
  const mergedEventsAllTrips = useMemo(() => {
    const merged = [];
    state.trips.forEach((trip) => {
      buildTripEvents(trip, state.companions).forEach((ev) => merged.push({ ...ev, tripId: trip.id }));
    });
    // Sort by date across trips (nulls last)
    merged.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date - b.date;
    });
    return merged;
  }, [state.trips, state.companions]);

  // Build summary HTML & plain text using the SAME chronology
  const { summaryHtml, summaryTextPlain } = useMemo(
    () => buildSummaryFromEvents(state, mergedEventsAllTrips),
    [state, mergedEventsAllTrips]
  );

  // Handlers
  const updateTrip = (tripId, patch) => setState((prev) => ({
    ...prev, trips: prev.trips.map((t) => (t.id === tripId ? { ...t, ...patch } : t)),
  }));

  const updateStop = (tripId, stopId, patch) => setState((prev) => ({
    ...prev,
    trips: prev.trips.map((t) => (
      t.id === tripId ? { ...t, stops: t.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)) } : t
    )),
  }));

  const addTrip = () => {
    const tr = emptyTrip();
    setState((p) => ({ ...p, trips: [...p.trips, tr] }));
    setPendingScrollId(tr.id);
  };

  const removeTrip = (tripId) => setState((p) => ({ ...p, trips: p.trips.filter((t) => t.id !== tripId) }));

  const addStop = (tripId) => {
    const s = emptyStop();
    setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: [...t.stops, s] } : t)) }));
    setPendingScrollId(s.id);
  };

  const removeStop = (tripId, stopId) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: t.stops.filter((s) => s.id !== stopId) } : t)) }));

  const addLayover = (tripId) => {
    const l = emptyLayover(tripId);
    setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: [...t.layovers, l] } : t)) }));
    setPendingScrollId(l.id);
  };

  const updateLayover = (tripId, layoverId, patch) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: t.layovers.map((l) => (l.id === layoverId ? { ...l, ...patch } : l)) } : t)) }));

  const removeLayover = (tripId, layoverId) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: t.layovers.filter((l) => l.id !== layoverId) } : t)) }));

  const clearAll = () => {
    if (confirm('Clear all data? This only affects this browser/session.')) {
      setState(initialState);
    }
  };

  return (
    <main className="py-10 sm:py-14">
      {/* Header */}
      <header className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Travel History Generator</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Build a clear, concise travel history. Provide as much information as possible to generate accurate history.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={clearAll} className={BTN_SECONDARY}>Clear all</button>
        </div>
      </header>

      {/* Privacy banner */}
<div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-4 text-amber-900 dark:text-amber-200 flex items-center gap-3">
  <span aria-hidden="true">⚠️</span>
  <p className="text-sm">Do not enter private or patient-identifiable information.</p>
</div>

      {/* Validation messages */}
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
                  onClick={() =>
  setState((p) => {
    const next = { ...p.companions, group: opt };
    if (opt === 'Alone') {
      next.companionsWell = 'unknown';
      next.companionsUnwellDetails = '';
      next.otherText = '';
    }
    return { ...p, companions: next };
  })
}
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
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
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
      {[
        { val: 'yes', label: 'Yes' },
        { val: 'no', label: 'No' },
        { val: 'unknown', label: 'Unknown' },
      ].map(({ val, label }) => (
        <button
          key={val}
          type="button"
          onClick={() =>
            setState((p) => ({
              ...p,
              companions: {
                ...p.companions,
                companionsWell: val,
                // Clear details if not "No"
                companionsUnwellDetails: val === 'no' ? p.companions.companionsUnwellDetails : '',
              },
            }))
          }
          className={classNames(
            'rounded-md px-3 py-1.5 text-sm border-2 transition',
            state.companions.companionsWell === val
              ? 'text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] border-transparent'
              : 'border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] text-slate-700 dark:text-slate-200'
          )}
        >
          {label}
        </button>
      ))}
    </div>

    {state.companions.companionsWell === 'no' && (
      <div className="mt-2">
        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
          Please provide details
        </label>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          value={state.companions.companionsUnwellDetails}
          onChange={(e) =>
            setState((p) => ({
              ...p,
              companions: { ...p.companions, companionsUnwellDetails: e.target.value },
            }))
          }
        />
      </div>
    )}
  </div>
)}
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline-section" className="mt-10 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <div className="flex items-center justify-between mb-3">
  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Timeline</h2>
</div>
        <TimelineVertical events={mergedEventsAllTrips} />
      </section>

      {/* Text summary */}
<section className="mt-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Travel History Summary</h2>
  <div className="text-sm text-slate-700 dark:text-slate-300">
    <div dangerouslySetInnerHTML={{ __html: summaryHtml }} />
  </div>
  <div className="mt-3 flex gap-2">
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(summaryTextPlain)}
      className={BTN_SECONDARY}
    >
      Copy summary
    </button>
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
  // Toggle trip-level vaccine
  const toggleTripVaccine = (v) => {
    const set = new Set(trip.vaccines || []);
    const had = set.has(v);
    if (had) set.delete(v); else set.add(v);

    const patch = { vaccines: Array.from(set) };

    // If "Other" is being unticked, clear the free-text
    if (v === 'Other' && had) {
      patch.vaccinesOther = '';
    }

    updateTrip(trip.id, patch);
  };

  // Update malaria (trip-level) and clean fields when not "Taken"
  const setMalaria = (patch) => {
    const next = { ...trip.malaria, ...patch };
    if (next.indication !== 'Taken') {
      next.drug = 'None';
      next.adherence = '';
    }
    updateTrip(trip.id, { malaria: next });
  };
   // ---- Trip origin helpers (country -> city list)
  // ---- Trip origin helpers (country -> city list)
const originISO2 = useMemo(
  () => getIsoFromCountryName(trip.originCountry),
  [trip.originCountry]
);

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

      {/* Travelling from */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
          Travelling from
        </label>
        <div className="mt-2 grid sm:grid-cols-2 gap-4">
          {/* Country */}
          <div>
            <CountryInput
              value={trip.originCountry}
              onChange={(val) => updateTrip(trip.id, { originCountry: val, originCity: '' })}
            />
          </div>
          {/* City (input + datalist like StopCard) */}
          <div className="w-full">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">City</label>
            <input
              type="text"
              list={`trip-origin-cities-${trip.id}`}
              placeholder="Start typing or select city…"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={trip.originCity || ''}
              onChange={(e) => updateTrip(trip.id, { originCity: e.target.value })}
            />
            <datalist id={`trip-origin-cities-${trip.id}`}>
              {originCityNames.map((nm) => (
                <option key={nm} value={nm} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Trip purpose */}
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3">
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Purpose</label>
          <input
            type="text"
            placeholder="Work, VFR, tourism, humanitarian, etc."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            value={trip.purpose}
            onChange={(e) => updateTrip(trip.id, { purpose: e.target.value })}
          />
        </div>
      </div>

      {/* Trip-wide Vaccines & Malaria */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {/* Vaccines */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Pre-travel vaccinations
          </label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VACCINE_OPTIONS.map((v) => (
              <Checkbox
                key={v}
                label={v}
                checked={(trip.vaccines || []).includes(v)}
                onChange={() => toggleTripVaccine(v)}
              />
            ))}
          </div>

          {/* Free-text for "Other" when selected */}
          {(trip.vaccines || []).includes('Other') && (
            <div className="mt-2">
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                Other vaccination(s)
              </label>
              <input
                type="text"
                placeholder="Enter vaccine name(s)…"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={trip.vaccinesOther || ''}
                onChange={(e) => updateTrip(trip.id, { vaccinesOther: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Malaria */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Malaria prophylaxis
          </label>
          <div className="mt-2 grid sm:grid-cols-3 gap-2">
            {/* Indication (single dropdown) */}
            <select
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={trip.malaria.indication}
              onChange={(e) => setMalaria({ indication: e.target.value })}
            >
              {MALARIA_INDICATIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {/* Drug (only when Taken) */}
            {trip.malaria.indication === 'Taken' && (
              <select
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={trip.malaria.drug}
                onChange={(e) => setMalaria({ drug: e.target.value })}
              >
                {MALARIA_DRUGS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            {/* Adherence (only when Taken) */}
            {trip.malaria.indication === 'Taken' && (
              <select
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={trip.malaria.adherence}
                onChange={(e) => setMalaria({ adherence: e.target.value })}
              >
                <option value="">Adherence…</option>
                <option value="Good">Good</option>
                <option value="Partial">Partial</option>
                <option value="Poor">Poor</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Stops */}
      <div className="mt-6 space-y-6">
        {trip.stops.map((stop, sIdx) => (
          <StopCard
            key={stop.id}
            innerRef={setItemRef(stop.id)}
            stop={stop}
            index={sIdx}
            onChange={(patch) => updateStop(trip.id, stop.id, patch)}
            onRemove={() => removeStop(trip.id, stop.id)}
            highlighted={highlight.stopIds.has(stop.id)}
          />
        ))}
      </div>

      {/* Layovers */}
      {trip.layovers.length > 0 && (
        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Layovers</h3>
          <div className="space-y-4">
            {trip.layovers.map((l) => (
              <LayoverCard
                key={l.id}
                innerRef={setItemRef(l.id)}
                layover={l}
                onChange={(patch) => updateLayover(trip.id, l.id, patch)}
                onRemove={() => removeLayover(trip.id, l.id)}
                highlighted={highlight.layoverIds.has(l.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


  function StopCard({ stop, index, onChange, onRemove, innerRef, highlighted }) {
  const exp = stop.exposures;

  // ---- Cities: normalize to objects { name, arrival, departure } ----
  const normalizedCities = (stop.cities || []).map((c) =>
    typeof c === 'string'
      ? { name: c || '', arrival: '', departure: '' }
      : {
          name: c?.name || '',
          arrival: c?.arrival || '',
          departure: c?.departure || '',
        }
  );

  // === NEW: derive cities from selected country ===
  const countryISO2 = useMemo(() => {
    const name = (stop.country || "").trim().toLowerCase();
    if (!name) return null;
    const match = Country.getAllCountries().find(
      (c) => c.name.trim().toLowerCase() === name
    );
    return match?.isoCode || null;
  }, [stop.country]);

  const cityOptions = useMemo(() => {
    return countryISO2 ? City.getCitiesOfCountry(countryISO2) : [];
  }, [countryISO2]);

const commitCities = (next) => onChange({ cities: next });

// Update name/arrival/departure for row i
const setCityName = (i, name) => {
  const next = [...normalizedCities];
  next[i] = { ...next[i], name };
  commitCities(next);
};

const setCityArrival = (i, arrival) => {
  const next = [...normalizedCities];
  next[i] = { ...next[i], arrival };
  commitCities(next);
};

const setCityDeparture = (i, departure) => {
  const next = [...normalizedCities];
  next[i] = { ...next[i], departure };
  commitCities(next);
};

const addCity = () => {
  commitCities([
    ...normalizedCities,
    { name: '', arrival: '', departure: '' },
  ]);
};

const removeCity = (i) => {
  const next = [...normalizedCities];
  next.splice(i, 1);
  if (next.length === 0) next.push({ name: '', arrival: '', departure: '' });
  commitCities(next);
};
    

  // Accommodation handlers (checkbox group)
  const toggleAccommodation = (value) => {
  const set = new Set(stop.accommodations || []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  onChange({ accommodations: Array.from(set) });
};

  return (
    <div
      ref={innerRef}
      className={classNames(
        "rounded-lg border p-4",
        highlighted
          ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10"
          : "border-slate-200 dark:border-slate-800"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Stop {index + 1}</h3>
        <button type="button" onClick={onRemove} className={LINKISH_SECONDARY}>Remove stop</button>
      </div>

 {/* Top row: Country + country-level dates */}
<div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <CountryInput
    value={stop.country}
    onChange={(val) => onChange({ country: val })}
  />

  <div>
    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Arrival *</label>
    <input
      type="date"
      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
      value={stop.arrival}
      onChange={(e) => onChange({ arrival: e.target.value })}
    />
  </div>

  <div>
    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Departure *</label>
    <input
      type="date"
      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
      value={stop.departure}
      onChange={(e) => onChange({ departure: e.target.value })}
    />
  </div>
</div>

{/* Below: Cities list */}
<div className="mt-4">
  {/* Header row — matches country label style + grid */}
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-1">
    <div>
      <label className="block text-sm text-slate-600 dark:text-slate-300">City</label>
    </div>
    <div>
      <label className="block text-sm text-slate-600 dark:text-slate-300">Arrival</label>
    </div>
    <div>
      <label className="block text-sm text-slate-600 dark:text-slate-300">Departure</label>
    </div>
    <div>{/* empty header cell for the Remove button column */}</div>
  </div>

  {/* Rows */}
  <div className="space-y-2">
   {normalizedCities.map((row, i) => {
  const listId = `city-list-${stop.id}-${i}`;
  return (
    <div key={i} className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* City input + datalist (matches CountryInput look/feel) */}
      <div className="w-full">
        <input
          type="text"
          list={listId}
          placeholder="Start typing or select city…"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          value={row.name}
          onChange={(e) => setCityName(i, e.target.value)}
        />
        <datalist id={listId}>
          {(cityOptions || []).map((opt) => (
            <option
              key={`${opt.name}-${opt.latitude}-${opt.longitude}`}
              value={opt.name}
            />
          ))}
        </datalist>
      </div>

      {/* Arrival */}
      <input
        type="date"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        value={row.arrival}
        onChange={(e) => setCityArrival(i, e.target.value)}
        aria-label="City arrival date"
      />

      {/* Departure */}
      <input
        type="date"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        value={row.departure}
        onChange={(e) => setCityDeparture(i, e.target.value)}
        aria-label="City departure date"
      />

      {/* Remove */}
      <div className="flex">
        <button
          type="button"
          onClick={() => removeCity(i)}
          className="w-full sm:w-auto rounded-lg px-3 py-2 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition"
        >
          Remove
        </button>
      </div>
    </div>
  );
})}


    <button
      type="button"
      onClick={addCity}
      className="rounded-lg px-3 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition"
    >
      + Add another city
    </button>
  </div>
</div>

      {/* Accommodation (checkbox group) */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Accommodation (select one or more)</label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ACCOMMODATION_OPTIONS.map((opt) => {
            const checked = (stop.accommodations || []).includes(opt);
            const id = `${stop.id}-accom-${opt.replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <label key={opt} htmlFor={id} className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                <input
                  id={id}
                  type="checkbox"
                  className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700"
                  checked={checked}
                  onChange={() => toggleAccommodation(opt)}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
        {(stop.accommodations || []).includes('Other') && (
          <div className="mt-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Other (describe)</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={stop.accommodationOther}
              onChange={(e) => onChange({ accommodationOther: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Exposures (UPDATED) */}
      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Activities / Exposures</h4>

        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
          {/* Vector-borne */}
          <fieldset className="space-y-1">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Vector-borne</legend>
            <ExposureRow label="Mosquito bites" status={exp.mosquito} details={exp.mosquitoDetails} onToggle={(v) => onChange({ exposures: { ...exp, mosquito: v } })} onDetails={(v) => onChange({ exposures: { ...exp, mosquitoDetails: v } })} />
            <ExposureRow label="Tick bites" status={exp.tick} details={exp.tickDetails} onToggle={(v) => onChange({ exposures: { ...exp, tick: v } })} onDetails={(v) => onChange({ exposures: { ...exp, tickDetails: v } })} />
            <div className="space-y-1 pt-2">
              <label className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                <span className="flex-1 font-medium">Other vector</span>
                <div className="flex gap-1">
                   {['yes', 'no'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onChange({ exposures: { ...exp, vectorOtherEnabled: opt === exp.vectorOtherEnabled ? 'unknown' : opt } })}
                        className={classNames(
                          "px-2 py-0.5 text-xs border rounded transition-colors",
                          exp.vectorOtherEnabled === opt
                             ? (opt === 'yes' ? "bg-rose-100 border-rose-300 text-rose-800 font-medium" : "bg-emerald-100 border-emerald-300 text-emerald-800 font-medium")
                             : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
                        )}
                      >
                        {cap(opt)}
                      </button>
                   ))}
                </div>
              </label>
             {exp.vectorOtherEnabled === 'yes' && (
               <input
                 type="text"
                 placeholder="Please provide more details."
                 className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
                 value={exp.vectorOtherDetails}
                 onChange={(e) => onChange({ exposures: { ...exp, vectorOtherDetails: e.target.value } })}
               />
             )}
            </div>
          </fieldset>

          {/* Water / Environment */}
          <fieldset className="space-y-1">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Water / Environment</legend>
            <ExposureRow label="Freshwater contact" status={exp.freshwater} details={exp.freshwaterDetails} onToggle={(v) => onChange({ exposures: { ...exp, freshwater: v } })} onDetails={(v) => onChange({ exposures: { ...exp, freshwaterDetails: v } })} />
            <ExposureRow label="Visited caves or mines" status={exp.cavesMines} details={exp.cavesMinesDetails} onToggle={(v) => onChange({ exposures: { ...exp, cavesMines: v } })} onDetails={(v) => onChange({ exposures: { ...exp, cavesMinesDetails: v } })} placeholder="If yes, any contact with bats?" />
            <ExposureRow label="Rural / forest stay" status={exp.ruralForest} details={exp.ruralForestDetails} onToggle={(v) => onChange({ exposures: { ...exp, ruralForest: v } })} onDetails={(v) => onChange({ exposures: { ...exp, ruralForestDetails: v } })} />
            <ExposureRow label="Hiking in forest/woodlands" status={exp.hikingWoodlands} details={exp.hikingWoodlandsDetails} onToggle={(v) => onChange({ exposures: { ...exp, hikingWoodlands: v } })} onDetails={(v) => onChange({ exposures: { ...exp, hikingWoodlandsDetails: v } })} />
          </fieldset>

          {/* Animal & Procedures */}
          <fieldset className="space-y-1">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Animal & Procedures</legend>
            <ExposureRow label="Animal contact" status={exp.animalContact} details={exp.animalContactDetails} onToggle={(v) => onChange({ exposures: { ...exp, animalContact: v } })} onDetails={(v) => onChange({ exposures: { ...exp, animalContactDetails: v } })} />
            <ExposureRow label="Animal bite / scratch" status={exp.animalBiteScratch} details={exp.animalBiteScratchDetails} onToggle={(v) => onChange({ exposures: { ...exp, animalBiteScratch: v } })} onDetails={(v) => onChange({ exposures: { ...exp, animalBiteScratchDetails: v } })} />
            <ExposureRow label="Bushmeat consumption" status={exp.bushmeat} details={exp.bushmeatDetails} onToggle={(v) => onChange({ exposures: { ...exp, bushmeat: v } })} onDetails={(v) => onChange({ exposures: { ...exp, bushmeatDetails: v } })} />
            <ExposureRow label="Needles / tattoos / piercings" status={exp.needlesTattoos} details={exp.needlesTattoosDetails} onToggle={(v) => onChange({ exposures: { ...exp, needlesTattoos: v } })} onDetails={(v) => onChange({ exposures: { ...exp, needlesTattoosDetails: v } })} />
            <ExposureRow label="Safari / wildlife viewing" status={exp.safariWildlife} details={exp.safariWildlifeDetails} onToggle={(v) => onChange({ exposures: { ...exp, safariWildlife: v } })} onDetails={(v) => onChange({ exposures: { ...exp, safariWildlifeDetails: v } })} />
          </fieldset>

          {/* Food & Water */}
          <fieldset className="space-y-1">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Food & Water</legend>
            <ExposureRow label="Street food" status={exp.streetFood} details={exp.streetFoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, streetFood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, streetFoodDetails: v } })} />
            <ExposureRow label="Drank untreated water" status={exp.untreatedWater} details={exp.untreatedWaterDetails} onToggle={(v) => onChange({ exposures: { ...exp, untreatedWater: v } })} onDetails={(v) => onChange({ exposures: { ...exp, untreatedWaterDetails: v } })} />
            <ExposureRow label="Undercooked food" status={exp.undercookedFood} details={exp.undercookedFoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, undercookedFood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, undercookedFoodDetails: v } })} />
            <ExposureRow label="Undercooked seafood" status={exp.undercookedSeafood} details={exp.undercookedSeafoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, undercookedSeafood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, undercookedSeafoodDetails: v } })} />
            <ExposureRow label="Unpasteurised milk" status={exp.unpasteurisedMilk} details={exp.unpasteurisedMilkDetails} onToggle={(v) => onChange({ exposures: { ...exp, unpasteurisedMilk: v } })} onDetails={(v) => onChange({ exposures: { ...exp, unpasteurisedMilkDetails: v } })} />
          </fieldset>

          {/* Institutional / Social */}
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
              <input type="text" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm" value={exp.otherText} onChange={(e) => onChange({ exposures: { ...exp, otherText: e.target.value } })} />
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

function LayoverCard({ layover, onChange, onRemove, innerRef, highlighted }) {
  // Derive ISO2 from the current country name
  const countryISO2 = useMemo(
    () => getIsoFromCountryName(layover.country),
    [layover.country]
  );

  // Build city options for that country
  // Build city options for that country (OBJECTS, like StopCard)
const cityOptions = useMemo(() => {
  return countryISO2 ? (City.getCitiesOfCountry(countryISO2) || []) : [];
}, [countryISO2]);

  return (
    <div
      ref={innerRef}
      className={classNames(
        "rounded-lg border p-4",
        highlighted
          ? "border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-900/10"
          : "border-slate-200 dark:border-slate-800"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Layover</h4>
        <button
          type="button"
          onClick={onRemove}
          className={LINKISH_SECONDARY}
        >
          Remove layover
        </button>
      </div>

      {/* Top row: Country / City / Start / End */}
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Country */}
        <div>
          <CountryInput
            value={layover.country}
            onChange={(val) => {
              // when country changes, clear city to avoid mismatch
              onChange({ country: val, city: "" });
            }}
          />
        </div>

        {/* City (input + datalist, same as StopCard) */}
<div className="w-full">
  <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">City</label>
  <input
    type="text"
    list={`layover-city-options-${layover.id}`}
    placeholder="Start typing or select city…"
    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
    value={layover.city || ""}
    onChange={(e) => onChange({ city: e.target.value })}
  />
  <datalist id={`layover-city-options-${layover.id}`}>
    {(cityOptions || []).map((opt) => (
      <option
        key={`${opt.name}-${opt.latitude}-${opt.longitude}`}
        value={opt.name}
      />
    ))}
  </datalist>
</div>

        {/* Start */}
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Start</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            value={layover.start}
            onChange={(e) => onChange({ start: e.target.value })}
          />
        </div>

        {/* End */}
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">End</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            value={layover.end}
            onChange={(e) => onChange({ end: e.target.value })}
          />
        </div>
      </div>

      {/* Left airport + activities */}
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
            Did you leave the airport?
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            value={layover.leftAirport}
            onChange={(e) => onChange({ leftAirport: e.target.value })}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        {layover.leftAirport === "yes" && (
          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
              Please describe any activities undertaken
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={layover.activitiesText}
              onChange={(e) => onChange({ activitiesText: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Small checkbox
function Checkbox({ label, checked, onChange }) {
  const id = useMemo(() => uid(), []);
  return (
    <label htmlFor={id} className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
      <input id={id} type="checkbox" className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

// UPDATED: Exposure Row with Green "No" button
function ExposureRow({ label, status, details, onToggle, onDetails, placeholder }) {
  // status: 'unknown' | 'yes' | 'no' (or legacy boolean false/true which we map)
  // map legacy boolean if exists
  const safeStatus = typeof status === 'boolean' ? (status ? 'yes' : 'unknown') : (status || 'unknown');

  return (
    <div className="py-1">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onToggle(safeStatus === 'yes' ? 'unknown' : 'yes')}
            className={classNames(
              "px-2 py-0.5 text-xs border rounded transition-colors",
              safeStatus === 'yes'
                ? "bg-rose-100 border-rose-300 text-rose-800 font-medium"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onToggle(safeStatus === 'no' ? 'unknown' : 'no')}
            className={classNames(
              "px-2 py-0.5 text-xs border rounded transition-colors",
              safeStatus === 'no'
                ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-medium"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400"
            )}
          >
            No
          </button>
        </div>
      </div>
      {safeStatus === 'yes' && (
        <div className="mt-1">
          <input
            type="text"
            placeholder={placeholder || "Please provide details..."}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
            value={details || ''}
            onChange={(e) => onDetails(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Timeline (Vertical) — with anchored layovers
 */
function TimelineVertical({ events }) {

  // Node component (10px brand with white ring)
  const Node = () => (
    <span
      className={classNames(
        "relative z-10 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900",
        NODE_COLOR
      )}
      aria-hidden="true"
    />
  );

  // Bucket layovers by their anchor stop and position
  const layoversByStop = useMemo(() => {
    const map = new Map(); // stopId -> { 'before-stop': [], between: [], 'after-stop': [] }
    for (const ev of events || []) {
      if (ev.type !== "layover" || !ev.anchorStopId) continue;
      const id = ev.anchorStopId;
      const pos = ev.position || "between";
      if (!map.has(id)) map.set(id, { "before-stop": [], between: [], "after-stop": [] });
      map.get(id)[pos].push(ev.layover);
    }
    return map;
  }, [events]);

  // Helper to render a layover as start row + strip + end row, using same visual language
  const LayoverRows = ({ l }) => (
    <>
      {/* Layover start */}
      <div className="col-[1] relative h-6 z-10">
        <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          {/* small grey node (different to stop node) */}
          <span
            className="relative z-10 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-400 dark:bg-slate-600"
            aria-hidden="true"
          />
        </span>
      </div>
      <div className="col-[2] h-6 flex items-center gap-3">
        <strong className="tabular-nums">{formatDMY(l.start)}</strong>
        <span className="text-xs text-slate-500">Layover start</span>
      </div>

      {/* Layover strip */}
      <div className="col-[1]" aria-hidden="true" />
      <div className="col-[2]">
        <div className="mt-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
          {(l.city ? `${l.city}, ` : "") + (l.country || "")}
          {l.leftAirport === "yes" && l.activitiesText ? ` · ${l.activitiesText}` : ""}
        </div>
      </div>

      {/* Layover end */}
      <div className="col-[1] relative h-6 z-10">
        <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <span
            className="relative z-10 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-400 dark:bg-slate-600"
            aria-hidden="true"
          />
        </span>
      </div>
      <div className="col-[2] h-6 flex items-center gap-3">
        <strong className="tabular-nums">{formatDMY(l.end)}</strong>
        <span className="text-xs text-slate-500">Layover end</span>
      </div>
    </>
  );

  return (
    <div className="relative">
      {/* Continuous dashed rail centered in the 72px gutter */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[36px] top-0 bottom-0 z-0 border-l-2 border-dashed border-slate-300 dark:border-slate-600"
      />

      <ol
        className="grid"
        style={{ gridTemplateColumns: "72px 1fr", rowGap: "12px" }}
      >
        {(events || []).map((ev, idx) => {
          if (ev.type !== "stop") return null; // layovers are rendered inline via anchors

          const it = ev.stop;

          return (
            <li key={`stop-${it.id}-${idx}`} className="contents">
              {/* Arrival row */}
              <div className="col-[1] relative h-6 z-10">
                <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                  <Node />
                </span>
              </div>
              <div className="col-[2] h-6 flex items-center">
                <div className="flex items-center gap-3">
                  <strong className="tabular-nums">{formatDMY(it.arrival)}</strong>
                  {it.isFirstInTrip && (
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      — {it.tripOriginCity || it.tripOriginCountry
                        ? `Departure from ${[it.tripOriginCity, it.tripOriginCountry].filter(Boolean).join(", ")}`
                        : "Departure"}
                    </span>
                  )}
                </div>
              </div>

              {/* Trip meta + companions under first stop */}
              {it.isFirstInTrip && (
                <div className="col-[2] mt-1 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
                  {it.tripPurpose ? (
                    <div>
                      <span className="font-semibold">Purpose:</span> {it.tripPurpose}
                    </div>
                  ) : null}
                  <div>
                    <span className="font-semibold">Malaria prophylaxis:</span>{" "}
                    {(() => {
                      const m = it.tripMalaria || {};
                      if (m.indication === "Taken") {
                        const drug = m.drug && m.drug !== "None" ? m.drug : "Taken";
                        return m.adherence ? `${drug}. Adherence: ${m.adherence}` : drug;
                      }
                      if (m.indication === "Not taken") return "Not taken";
                      return "Not indicated";
                    })()}
                  </div>
                  <div>
                    <span className="font-semibold">Vaccinations:</span>{" "}
                    {(() => {
                      const arr = Array.isArray(it.tripVaccines) ? it.tripVaccines : [];
                      const hasOther = arr.includes("Other");
                      const base = (hasOther ? arr.filter((v) => v !== "Other") : arr).join(", ");
                      const otherText = (it.tripVaccinesOther || "").trim();

                      if (hasOther && otherText) {
                        return base ? `${base}, Other: ${otherText}` : `Other: ${otherText}`;
                      }
                      return base ? (hasOther ? `${base}, Other` : base) : hasOther ? "Other" : "None";
                    })()}
                  </div>
                  {it.tripCompanions && (
                    <>
                      {it.tripCompanions.group === "Alone" ? (
                        <div>
                          <span className="font-semibold">Travelled alone.</span>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="font-semibold">Travelled with:</span>{" "}
                            {it.tripCompanions.group === "Other"
                              ? it.tripCompanions.otherText || "Other"
                              : it.tripCompanions.group || "—"}
                          </div>
                          <div>
                            <span className="font-semibold">Are they well:</span>{" "}
                            {it.tripCompanions.companionsWell === "yes"
                              ? "Yes"
                              : it.tripCompanions.companionsWell === "no"
                              ? "No" +
                                (it.tripCompanions.companionsUnwellDetails?.trim()
                                  ? ` — ${it.tripCompanions.companionsUnwellDetails.trim()}`
                                  : "")
                              : "Unknown"}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Layovers BEFORE the first stop's country card */}
              {(layoversByStop.get(it.id)?.["before-stop"] || []).map((l) => (
                <LayoverRows key={`layover-before-${l.id}`} l={l} />
              ))}

              {/* Country card */}
              <div className="col-[1]" aria-hidden="true" />
              <div className="col-[2]">
                <div className="relative z-0 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
                  {/* Country & Cities */}
                  <h3
                    className="text-base font-semibold text-slate-900 dark:text-slate-100"
                    title={it.country || it.label}
                  >
                    {it.country || it.label || "—"}
                  </h3>
                  {it.cities && it.cities.length > 0 && (
                    <div className="mt-1 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
                      {it.cities.map((c, i) => {
                        const obj = typeof c === "string" ? { name: c } : c || {};
                        const nm = obj.name || "";
                        const a = obj.arrival ? formatDMY(obj.arrival) : "";
                        const d = obj.departure ? formatDMY(obj.departure) : "";
                        const datePart = a || d ? ` (${a || "—"} to ${d || "—"})` : "";
                        if (!nm) return null;
                        return (
                          <div key={i}>
                            {nm}
                            {datePart}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Details grid */}
                  <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Accommodation:</span>{" "}
                      {it.accommodations?.length
                        ? it.accommodations.includes("Other") && it.accommodationOther
                          ? [
                              ...it.accommodations.filter((a) => a !== "Other"),
                              `Other: ${it.accommodationOther}`,
                            ].join(", ")
                          : it.accommodations.join(", ")
                        : "—"}
                    </div>

                    {/* Exposures with details */}
                    <div className="text-sm sm:col-span-2">
                      <span className="font-medium">Exposures:</span>{" "}
                      {(() => {
                        const { positives, negatives } = exposureBullets(it.exposures);
                        if (!positives.length && !negatives.length) return "—";
                        
                        return (
                          <div className="mt-1 space-y-2">
                             {positives.length > 0 && (
                               <ul className="list-disc pl-5">
                                 {positives.map(({ label, details }, i) => (
                                   <li key={i} className="text-sm">
                                     {details ? `${label} — ${details}` : label}
                                   </li>
                                 ))}
                               </ul>
                             )}
                             {negatives.length > 0 && (
                               <div>
                                 <div className="font-semibold text-xs uppercase tracking-wide text-slate-500 mt-2">No exposures to</div>
                                 <ul className="list-disc pl-5 text-slate-500">
                                   {negatives.map((label, i) => (
                                      <li key={i} className="text-sm">{label}</li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Layovers BETWEEN this country and the next (immediately after this card) */}
              {(layoversByStop.get(it.id)?.between || []).map((l) => (
                <LayoverRows key={`layover-between-${l.id}`} l={l} />
              ))}

              {/* Layovers AFTER the last country card but BEFORE the departure row */}
              {it.isLastInTrip &&
                (layoversByStop.get(it.id)?.["after-stop"] || []).map((l) => (
                  <LayoverRows key={`layover-after-${l.id}`} l={l} />
                ))}

              {/* Departure row */}
              <div className="col-[1] relative h-6 z-10">
                <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                  <Node />
                </span>
              </div>
              <div className="col-[2] h-6 flex items-center gap-3">
                <strong className="tabular-nums">{formatDMY(it.departure)}</strong>
                {it.isLastInTrip && (
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    —{" "}
                    {it.tripOriginCity || it.tripOriginCountry
                      ? `Arrival to ${[it.tripOriginCity, it.tripOriginCountry]
                          .filter(Boolean)
                          .join(", ")}`
                      : "Arrival"}
                  </span>
                )}
              </div>
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

  // Group events by trip id to render per-trip sections
  const byTrip = new Map();
  (mergedEventsAllTrips || []).forEach((ev) => {
    if (!byTrip.has(ev.tripId)) byTrip.set(ev.tripId, []);
    byTrip.get(ev.tripId).push(ev);
  });
  const tripsCount = byTrip.size;

  let tripIndex = 1;
  for (const [tripId, events] of byTrip.entries()) {
    // Stops & date range for this trip
    const stops = events.filter((e) => e.type === "stop").map((e) => e.stop);
    const arrivals = stops.map((s) => parseDate(s.arrival)).filter(Boolean);
    const departures = stops.map((s) => parseDate(s.departure)).filter(Boolean);
    const start = arrivals.length ? formatDMY(new Date(Math.min(...arrivals)).toISOString()) : "—";
    const end = departures.length ? formatDMY(new Date(Math.max(...departures)).toISOString()) : "—";

    // Countries list (unique, ordered)
    const countriesList = [];
    const seen = new Set();
    stops.forEach((s) => {
      const c = (s.country || "").trim();
      if (c && !seen.has(c)) {
        seen.add(c);
        countriesList.push(c);
      }
    });
    const countriesCsv = countriesList.join(", ") || "—";

    // Trip heading
    if (tripsCount === 1) {
      html.push(`<p><strong>Trip details:</strong></p>`);
      text.push(`Trip details:`);
    } else {
      html.push(`<p><strong>Trip ${tripIndex}</strong></p>`);
      text.push(`Trip ${tripIndex}`);
    }

    // Dates + Countries travelled (unchanged)
    html.push(`<div>Dates: ${escapeHtml(`${start} to ${end}`)}</div>`);
    text.push(`Dates: ${start} to ${end}`);

    html.push(
      `<div>Country / countries travelled (See below for details of the countries in this trip): ${escapeHtml(
        countriesCsv
      )}</div>`
    );
    text.push(
      `Country / countries travelled (See below for details of the countries in this trip): ${countriesCsv}`
    );

    // Pull canonical trip object for trip-level lines
    const tripObj = state.trips.find((t) => t.id === tripId) || {};

    // Travelling from
    {
      const fromCity = (tripObj.originCity || "").trim();
      const fromCountry = (tripObj.originCountry || "").trim();
      if (fromCity || fromCountry) {
        const fromLine = [fromCity, fromCountry].filter(Boolean).join(", ");
        html.push(`<div>Travelling from: ${escapeHtml(fromLine)}</div>`);
        text.push(`Travelling from: ${fromLine}`);
      }
    }

    // Purpose
    if (tripObj.purpose && tripObj.purpose.trim()) {
      html.push(`<div>Purpose: ${escapeHtml(tripObj.purpose)}</div>`);
      text.push(`Purpose: ${tripObj.purpose}`);
    }

    // Malaria prophylaxis
    {
      const m = tripObj.malaria || {
        indication: "Not indicated",
        drug: "None",
        adherence: "",
      };
      let malariaText;
      if (m.indication === "Taken") {
        const drug = m.drug && m.drug !== "None" ? m.drug : "Taken";
        malariaText = m.adherence ? `${drug}. Adherence: ${m.adherence}` : drug;
      } else if (m.indication === "Not taken") {
        malariaText = "Not taken";
      } else {
        malariaText = "Not indicated";
      }
      html.push(`<div>Malaria prophylaxis: ${escapeHtml(malariaText)}</div>`);
      text.push(`Malaria prophylaxis: ${malariaText}`);
    }

    // Vaccinations
    {
      const vaccinesArr = Array.isArray(tripObj.vaccines) ? tripObj.vaccines : [];
      const hasOther = vaccinesArr.includes("Other");
      const baseList = hasOther ? vaccinesArr.filter((v) => v !== "Other") : vaccinesArr;
      let vaccinesDisplay = baseList.join(", ");
      const otherText = (tripObj.vaccinesOther || "").trim();
      if (hasOther && otherText) {
        vaccinesDisplay = vaccinesDisplay ? `${vaccinesDisplay}, Other: ${otherText}` : `Other: ${otherText}`;
      } else if (hasOther) {
        vaccinesDisplay = vaccinesDisplay ? `${vaccinesDisplay}, Other` : "Other";
      }
      html.push(
        `<div>Pre-travel vaccinations: ${vaccinesDisplay ? escapeHtml(vaccinesDisplay) : "None"}</div>`
      );
      text.push(`Pre-travel vaccinations: ${vaccinesDisplay || "None"}`);
    }

    // Companions
    {
      const cmp = state.companions || {};
      if (cmp.group === "Alone") {
        html.push(`<div>Travelled alone.</div>`);
        text.push(`Travelled alone.`);
      } else {
        const groupStr = cmp.group === "Other" ? cmp.otherText || "Other" : cmp.group || "—";
        html.push(`<div>Travelled with: ${escapeHtml(groupStr)}</div>`);
        text.push(`Travelled with: ${groupStr}`);

        const wellStr =
          cmp.companionsWell === "yes" ? "Yes" : cmp.companionsWell === "no" ? "No" : "Unknown";

        if (cmp.companionsWell === "no") {
          const details = (cmp.companionsUnwellDetails || "").trim();
          html.push(
            `<div>Are they well: No${details ? ` — ${escapeHtml(details)}` : ""}</div>`
          );
          text.push(`Are they well: No${details ? ` — ${details}` : ""}`);
        } else {
          html.push(`<div>Are they well: ${wellStr}</div>`);
          text.push(`Are they well: ${wellStr}`);
        }
      }
    }

    // ===== Layover indexing for this trip (by anchor stop) =====
    const layoversByStop = new Map(); // stopId -> { before: [], between: [], after: [] }
    events
      .filter((e) => e.type === "layover" && e.anchorStopId)
      .forEach((e) => {
        const sid = e.anchorStopId;
        if (!layoversByStop.has(sid)) layoversByStop.set(sid, { before: [], between: [], after: [] });
        const bucket =
          e.position === "before-stop"
            ? "before"
            : e.position === "after-stop"
            ? "after"
            : "between";
        layoversByStop.get(sid)[bucket].push(e.layover);
      });

    // Helper: format one layover line (HTML string + text string)
    const fmtLayover = (l) => {
      const place = `${(l.city ? `${l.city}, ` : "") + (l.country || "")}`.trim();
      const dates = `(${formatDMY(l.start) || "—"}–${formatDMY(l.end) || "—"})`;
      const act =
        l.leftAirport === "yes" && (l.activitiesText || "").trim()
          ? ` · ${l.activitiesText.trim()}`
          : "";
      const line = `${place} ${dates}${act}`;
      return {
        html: escapeHtml(line),
        text: line,
      };
    };

    // Render each country (stop) with attached layovers
    events.forEach((ev, idxInTrip) => {
      if (ev.type !== "stop") return;
      const s = ev.stop;
      const isLastStop = !!s.isLastInTrip;

      // Country heading with dates
      const country = escapeHtml(s.country || "—");
      const countryDates = `${formatDMY(s.arrival) || "—"} to ${formatDMY(s.departure) || "—"}`;
       // Blank line / spacer before each country block (HTML + plain text)
      html.push(`<div style="height:8px"></div>`);
      text.push("");
      html.push(`<p><strong>${country} (${escapeHtml(countryDates)})</strong></p>`);
      text.push(`${s.country || "—"} (${countryDates})`);

      // --- Layovers BEFORE this country (only for the first stop) ---
      const beforeList = (layoversByStop.get(s.id)?.before || []).map(fmtLayover);
      if (beforeList.length) {
        html.push(`<div>Layovers before this country:</div>`);
        text.push(`Layovers before this country:`);
        html.push(`<ul>${beforeList.map((v) => `<li>${v.html}</li>`).join("")}</ul>`);
        beforeList.forEach((v) => text.push(`- ${v.text}`));
      }

    // Cities / regions
const citiesArr = (s.cities || [])
  .map((c) =>
    typeof c === "string"
      ? { name: c, arrival: "", departure: "" }
      : {
          name: c?.name || "",
          arrival: c?.arrival || "",
          departure: c?.departure || "",
        }
  )
  .filter((c) => c.name);

if (citiesArr.length) {
  html.push(`<div>Cities / regions:</div>`);
  text.push(`Cities / regions:`);
  text.push(""); // blank line before bullets

  // ✅ proper bullets in HTML
  html.push('<ul class="list-disc pl-5">');
  citiesArr.forEach((cObj) => {
    const a = cObj.arrival ? formatDMY(cObj.arrival) : "";
    const d = cObj.departure ? formatDMY(cObj.departure) : "";
    const datePart = a || d ? ` (${a || "—"} to ${d || "—"})` : "";
    const line = `${cObj.name}${datePart}`;
    html.push(`<li>${escapeHtml(line)}</li>`);
    text.push(`• ${line}`);
  });
  html.push("</ul>");
  text.push(""); // blank line after list
} else {
  html.push(`<div>Cities / regions: —</div>`);
  text.push(`Cities / regions: —`);
}

// Accommodation
const accom = s.accommodations?.length
  ? (s.accommodations.includes("Other") && s.accommodationOther
      ? [
          ...s.accommodations.filter((a) => a !== "Other"),
          `Other: ${s.accommodationOther}`,
        ].join(", ")
      : s.accommodations.join(", "))
  : "";
if (accom) {
  html.push(`<div>Accommodation: ${escapeHtml(accom)}</div>`);
  text.push(`Accommodation: ${accom}`);
} else {
  html.push(`<div>Accommodation: —</div>`);
  text.push(`Accommodation: —`);
}

// Exposures (bulleted list)
// UPDATED: Now splits positive and negative findings
const { positives, negatives } = exposureBullets(s.exposures);

if (positives.length > 0 || negatives.length > 0) {
  // Positives first
  if (positives.length > 0) {
    html.push(`<div>Exposures:</div>`);
    text.push(`Exposures:`);
    text.push("");

    html.push('<ul class="list-disc pl-5">');
    positives.forEach(({ label, details }) => {
      const line = details ? `${label} — ${details}` : label;
      html.push(`<li>${escapeHtml(line)}</li>`);
      text.push(`• ${line}`);
    });
    html.push("</ul>");
    text.push("");
  }

  // Negatives second (with new heading)
  if (negatives.length > 0) {
    html.push(`<div><strong>No exposures to:</strong></div>`);
    text.push(`No exposures to:`);
    text.push("");

    html.push('<ul class="list-disc pl-5">');
    negatives.forEach((label) => {
      html.push(`<li>${escapeHtml(label)}</li>`);
      text.push(`• ${label}`);
    });
    html.push("</ul>");
    text.push("");
  }

} else {
  html.push(`<div>Exposures: —</div>`);
  text.push(`Exposures: —`);
}

      // --- Layovers BETWEEN this country and the next ---
      const betweenList = (layoversByStop.get(s.id)?.between || []).map(fmtLayover);
      if (betweenList.length) {
        html.push(`<div>Layovers to next destination:</div>`);
        text.push(`Layovers to next destination:`);
        html.push(`<ul>${betweenList.map((v) => `<li>${v.html}</li>`).join("")}</ul>`);
        betweenList.forEach((v) => text.push(`- ${v.text}`));
      }

      // --- Layovers AFTER this trip (only for last stop) ---
      if (isLastStop) {
        const afterList = (layoversByStop.get(s.id)?.after || []).map(fmtLayover);
        if (afterList.length) {
          html.push(`<div>Layovers after this trip:</div>`);
          text.push(`Layovers after this trip:`);
          html.push(`<ul>${afterList.map((v) => `<li>${v.html}</li>`).join("")}</ul>`);
          afterList.forEach((v) => text.push(`- ${v.text}`));
        }
      }
    });

    tripIndex += 1;
  }

  return { summaryHtml: html.join("\n"), summaryTextPlain: text.join("\n") };
}
function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}


// UPDATED: Split exposure bullets into positives and negatives
function exposureBullets(exp) {
  if (!exp) return { positives: [], negatives: [] };
  const positives = [];
  const negatives = [];

  const push = (label, status, details) => {
    // status can be 'yes', 'no', 'unknown' (or legacy boolean)
    let s = status;
    if (typeof s === 'boolean') s = s ? 'yes' : 'unknown';

    if (s === 'yes') {
      positives.push({ label: cap(label), details: details?.trim() || '' });
    } else if (s === 'no') {
      negatives.push(cap(label));
    }
  };

  // Vector
  push('mosquito bites', exp.mosquito, exp.mosquitoDetails);
  push('tick bites', exp.tick, exp.tickDetails);
  if (exp.vectorOtherEnabled === 'yes') {
    positives.push({ label: 'Other vector', details: exp.vectorOtherDetails?.trim() || '' });
  } else if (exp.vectorOtherEnabled === 'no') {
    negatives.push('Other vector');
  }

  // Environment
  push('freshwater contact', exp.freshwater, exp.freshwaterDetails);
  push('visited caves or mines', exp.cavesMines, exp.cavesMinesDetails);
  push('rural / forest stay', exp.ruralForest, exp.ruralForestDetails);
  push('hiking in forest / bush / woodlands', exp.hikingWoodlands, exp.hikingWoodlandsDetails);

  // Animal & procedures
  push('animal contact', exp.animalContact, exp.animalContactDetails);
  push('animal bite / scratch', exp.animalBiteScratch, exp.animalBiteScratchDetails);
  push('bushmeat consumption', exp.bushmeat, exp.bushmeatDetails);
  push('needles / tattoos / piercings', exp.needlesTattoos, exp.needlesTattoosDetails);
  push('safari / wildlife viewing', exp.safariWildlife, exp.safariWildlifeDetails);

  // Food & water
  push('street food', exp.streetFood, exp.streetFoodDetails);
  push('untreated water', exp.untreatedWater, exp.untreatedWaterDetails);
  push('undercooked food', exp.undercookedFood, exp.undercookedFoodDetails);
  push('undercooked seafood', exp.undercookedSeafood, exp.undercookedSeafoodDetails);
  push('unpasteurised milk', exp.unpasteurisedMilk, exp.unpasteurisedMilkDetails);

  // Social / institutional
  push('attended funerals', exp.funerals, exp.funeralsDetails);
  push('sick contacts (including TB)', exp.sickContacts, exp.sickContactsDetails);
  push('healthcare facility contact', exp.healthcareFacility, exp.healthcareFacilityDetails);
  push('prison contact', exp.prison, exp.prisonDetails);
  push('refugee camp contact', exp.refugeeCamp, exp.refugeeCampDetails);
  push('unprotected sex', exp.unprotectedSex, exp.unprotectedSexDetails);

  if (exp.otherText?.trim()) {
      positives.push({ label: exp.otherText.trim(), details: '' });
  }

  return { positives, negatives };
}
