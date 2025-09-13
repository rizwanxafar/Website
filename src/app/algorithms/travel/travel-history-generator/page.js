'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v9
// Changes in v9:
// - Companions added to both visual and text summaries
// - Stops numbered in text summary (Stop 1, Stop 2, …)
// - Removed separate tripMeta node/card; trip meta shown under first stop’s arrival
// - Print timeline uses display:none to avoid multi-page bloat

import { useEffect, useMemo, useRef, useState } from 'react';

// ---- Minimal countries stub for datalist (replace with canonical dataset later) ----
const COUNTRY_STUB = [
  'United Kingdom', 'Ireland', 'France', 'Spain', 'Portugal', 'Germany', 'Italy', 'Greece',
  'United States', 'Canada', 'Australia', 'New Zealand', 'India', 'Pakistan', 'China', 'Japan',
  'Thailand', 'United Arab Emirates', 'Singapore', 'South Africa', 'Kenya', 'Brazil', 'Argentina',
  'Mexico', 'Turkey', 'Côte d’Ivoire',
];

// ---- Options ----
const ACCOMMODATION_OPTIONS = [
  'Hotel/Resort', 'Hostel', 'Homestay', 'Friends/Family home', 'Rural camp', 'Safari camp',
  'Refugee camp', 'Healthcare facility residence', 'Other', 'Prefer not to say',
];

const VACCINE_OPTIONS = [
  'Yellow fever', 'Hepatitis A', 'Hepatitis B', 'Typhoid', 'Meningitis ACWY', 'Rabies (pre-exposure)',
];

const MALARIA_DRUGS = ['None', 'Atovaquone/Proguanil', 'Doxycycline', 'Mefloquine', 'Chloroquine'];
const MALARIA_INDICATIONS = ['Not indicated', 'Indicated'];

// ---- Theme helpers ----
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white " +
  "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition";

const BTN_SECONDARY =
  "rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition";

const BADGE_PRIMARY =
  "inline-flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-semibold " +
  "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))]";

const LINKISH_SECONDARY =
  "rounded-lg px-3 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition";

const NODE_COLOR = "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))]";

// ---- Persistence ----
const LS_KEY = 'travel-history-generator:v9';

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
  cities: [''], // multiple cities per stop
  arrival: '',
  departure: '',
  accommodations: [], // multiple accommodation types
  accommodationOther: '',

  // Exposures with per-exposure details
  exposures: {
    // Vector
    mosquito: false, mosquitoDetails: '',         // Mosquito bites
    tick: false, tickDetails: '',                 // Tick bites
    vectorOtherEnabled: false, vectorOther: '', vectorOtherDetails: '',
    // Environment
    freshwater: false, freshwaterDetails: '',
    cavesMines: false, cavesMinesDetails: '',     // Visited caves/mines
    ruralForest: false, ruralForestDetails: '',   // Rural / forest stay
    hikingWoodlands: false, hikingWoodlandsDetails: '', // Hiking in forest/bush/woodlands
    // Animal / procedures
    animalContact: false, animalContactDetails: '',
    animalBiteScratch: false, animalBiteScratchDetails: '',
    bushmeat: false, bushmeatDetails: '',         // Bushmeat consumption
    needlesTattoos: false, needlesTattoosDetails: '',
    safariWildlife: false, safariWildlifeDetails: '',
    // Food / water
    streetFood: false, streetFoodDetails: '',
    untreatedWater: false, untreatedWaterDetails: '',
    undercookedFood: false, undercookedFoodDetails: '',
    undercookedSeafood: false, undercookedSeafoodDetails: '',
    unpasteurisedMilk: false, unpasteurisedMilkDetails: '',
    // Social / institutional
    funerals: false, funeralsDetails: '',         // Attended funerals
    largeGatherings: false, largeGatheringsDetails: '',
    sickContacts: false, sickContactsDetails: '', // Sick contacts (incl. TB)
    healthcareFacility: false, healthcareFacilityDetails: '',
    prison: false, prisonDetails: '',
    refugeeCamp: false, refugeeCampDetails: '',
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
  // Trip-level vaccines & malaria
  vaccines: [],
  malaria: { indication: 'Not indicated', took: false, drug: 'None', adherence: '' },
  stops: [emptyStop()],
  layovers: [],
});

const initialState = {
  trips: [emptyTrip()],
  companions: { group: 'Alone', otherText: '', companionsWell: 'unknown' }, // yes | no | unknown
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

  // Emit: layovers before first (by end asc), then stop0, (between 0&1), stop1, ..., then layovers after last (by start asc)
  beforeFirst.sort((a, b) => (parseDate(a.end) - parseDate(b.end)));
  beforeFirst.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l }));

  stopsSorted.forEach((s, i) => {
    const isFirstInTrip = s.id === firstStop.id;
    const isLastInTrip = s.id === lastStop.id;
    events.push({
      type: 'stop',
      date: parseDate(s.arrival),
      stop: {
        ...s,
        isFirstInTrip,
        isLastInTrip,
        tripPurpose: trip.purpose,
        tripVaccines: trip.vaccines || [],
        tripMalaria: trip.malaria || { indication: 'Not indicated', took: false, drug: 'None', adherence: '' },
        tripCompanions: companions || null,
      }
    });
    if (i < betweenByIndex.length) {
      const group = betweenByIndex[i].sort((a, b) => (parseDate(a.start) - parseDate(b.start)));
      group.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l }));
    }
  });

  afterLast.sort((a, b) => (parseDate(a.start) - parseDate(b.start)));
  afterLast.forEach((l) => events.push({ type: 'layover', date: parseDate(l.start), layover: l }));

  return events;
}

// ===== Main Page Component =====
export default function TravelHistoryGeneratorPage() {
  const [state, setState] = useState(initialState);
  const [showAbout, setShowAbout] = useState(false);
  const [issues, setIssues] = useState([]);
  const [highlight, setHighlight] = useState({ stopIds: new Set(), layoverIds: new Set() });
  const [pendingScrollId, setPendingScrollId] = useState(null);
  const itemRefs = useRef(new Map());
  const setItemRef = (id) => (el) => { if (el) itemRefs.current.set(id, el); };

  // Restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.trips)) setState(parsed);
      }
    } catch {/* noop */}
  }, []);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {/* noop */}
  }, [state]);

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
      localStorage.removeItem(LS_KEY);
      setState(initialState);
    }
  };

  const handlePrintTimeline = () => {
    try {
      const body = document.body;
      body.classList.add('print-timeline-only');
      const cleanup = () => {
        body.classList.remove('print-timeline-only');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
    } catch {/* noop */}
  };

  return (
    <main className="py-10 sm:py-14">
      {/* Header */}
      <header className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Travel History Generator</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Build a clear, printable travel history. Provide as much information as possible to generate accurate history.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowAbout(true)} className={BTN_SECONDARY}>About</button>
          <button type="button" onClick={clearAll} className={BTN_SECONDARY}>Clear all</button>
        </div>
      </header>

      {/* Privacy banner */}
      <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-4 text-amber-900 dark:text-amber-200">
        <p className="text-sm"><strong>Privacy:</strong> No data is stored on our servers. This tool uses your browser storage only. Do <strong>not</strong> enter private or patient-identifiable information.</p>
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

      {/* Stepper */}
      <ol className="mb-8 grid gap-4 sm:grid-cols-4">
        {['Countries & stops', 'Layovers', 'Companions', 'Review & generate'].map((label, idx) => (
          <li key={label} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
            <span className={BADGE_PRIMARY}>{idx + 1}</span>
            <span className="text-slate-800 dark:text-slate-200">{label}</span>
          </li>
        ))}
      </ol>

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
                  onClick={() => setState((p) => ({ ...p, companions: { ...p.companions, group: opt } }))}
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

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Companions well?</label>
            <div className="flex gap-2">
              {[
                { val: 'yes', label: 'Yes' },
                { val: 'no', label: 'No' },
                { val: 'unknown', label: 'Unknown' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setState((p) => ({ ...p, companions: { ...p.companions, companionsWell: val } }))}
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
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mt-10 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6 tl-printable">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Timeline</h2>
          <button type="button" onClick={handlePrintTimeline} className={BTN_SECONDARY}>Print timeline</button>
        </div>
        <TimelineVertical events={mergedEventsAllTrips} />
      </section>

      {/* Text summary */}
      <section className="mt-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Text summary</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
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

      {/* About modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAbout(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">About this tool</h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              This generator creates a travel history summary (text + timeline). Data is stored only in your browser for this session.
              Do not enter private or patient-identifiable information.
            </p>
            <div className="mt-4 text-right">
              <button type="button" onClick={() => setShowAbout(false)} className={LINKISH_SECONDARY + " text-sm px-3 py-2"}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          header, .no-print { display: none !important; }
          main { padding: 0 !important; }
        }
        /* Print only the timeline section; avoid multipage bloat */
        @media print {
          body.print-timeline-only main > *:not(.tl-printable) { display: none !important; }
          body.print-timeline-only .tl-printable { display: block !important; }
        }
      `}</style>
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
    if (set.has(v)) set.delete(v); else set.add(v);
    updateTrip(trip.id, { vaccines: Array.from(set) });
  };

  // Update malaria (trip-level)
  const setMalaria = (patch) => updateTrip(trip.id, { malaria: { ...trip.malaria, ...patch } });

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
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Pre-travel vaccinations</label>
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
        </div>

        {/* Malaria */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Malaria prophylaxis</label>
          <div className="mt-2 grid sm:grid-cols-3 gap-2">
            {/* Indication */}
            <select
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={trip.malaria.indication}
              onChange={(e) => setMalaria({ indication: e.target.value })}
            >
              {MALARIA_INDICATIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </select>

            {/* Took? (enabled only if indicated) */}
            <div className="flex items-center gap-2">
              <input
                id={`malaria-took-${trip.id}`}
                type="checkbox"
                className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700"
                checked={trip.malaria.took}
                onChange={(e) => setMalaria({ took: e.target.checked })}
                disabled={trip.malaria.indication !== 'Indicated'}
              />
              <label htmlFor={`malaria-took-${trip.id}`} className="text-sm text-slate-700 dark:text-slate-300">Took prophylaxis</label>
            </div>

            {/* Drug */}
            <select
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={trip.malaria.drug}
              onChange={(e) => setMalaria({ drug: e.target.value })}
              disabled={!trip.malaria.took || trip.malaria.indication !== 'Indicated'}
            >
              {MALARIA_DRUGS.map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>

            {/* Adherence */}
            <select
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={trip.malaria.adherence}
              onChange={(e) => setMalaria({ adherence: e.target.value })}
              disabled={!trip.malaria.took || trip.malaria.indication !== 'Indicated'}
            >
              <option value="">Adherence…</option>
              <option value="Good">Good</option>
              <option value="Partial">Partial</option>
              <option value="Poor">Poor</option>
            </select>
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

  // Cities handlers
  const setCity = (i, val) => {
    const cities = [...(stop.cities || [])];
    cities[i] = val;
    onChange({ cities });
  };
  const addCity = () => onChange({ cities: [...(stop.cities || []), ''] });
  const removeCity = (i) => {
    const cities = [...(stop.cities || [])];
    cities.splice(i, 1);
    if (cities.length === 0) cities.push('');
    onChange({ cities });
  };

  // Accommodation handlers (checkbox group)
  const toggleAccommodation = (value) => {
    const set = new Set(stop.accommodations || []);
    if (set.has(value)) set.delete(value);
    else {
      if (value === 'Prefer not to say') {
        set.clear();
        set.add(value);
      } else {
        set.delete('Prefer not to say');
        set.add(value);
      }
    }
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

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Country *</label>
          <input list="country-options" type="text" placeholder="Start typing…" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={stop.country} onChange={(e) => onChange({ country: e.target.value })} />
          <datalist id="country-options">
            {COUNTRY_STUB.map((c) => (<option key={c} value={c} />))}
          </datalist>
        </div>

        {/* Multiple cities */}
        <div className="lg:col-span-3">
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Cities</label>
          <div className="space-y-2">
            {(stop.cities || []).map((c, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" placeholder="City / locality" className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={c} onChange={(e) => setCity(i, e.target.value)} />
                <button type="button" onClick={() => removeCity(i)} className={LINKISH_SECONDARY}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={addCity} className={BTN_SECONDARY + " text-xs px-3 py-1.5"}>+ Add another city</button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Arrival date *</label>
          <input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={stop.arrival} onChange={(e) => onChange({ arrival: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Departure date *</label>
          <input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={stop.departure} onChange={(e) => onChange({ departure: e.target.value })} />
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

      {/* Exposures */}
      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Activities / Exposures</h4>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Vector-borne */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Vector-borne</legend>
            <ExposureCheck label="Mosquito bites" checked={exp.mosquito} details={exp.mosquitoDetails} onToggle={(v) => onChange({ exposures: { ...exp, mosquito: v } })} onDetails={(v) => onChange({ exposures: { ...exp, mosquitoDetails: v } })} />
            <ExposureCheck label="Tick bites" checked={exp.tick} details={exp.tickDetails} onToggle={(v) => onChange({ exposures: { ...exp, tick: v } })} onDetails={(v) => onChange({ exposures: { ...exp, tickDetails: v } })} />
            <div className="space-y-1">
              <label className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700"
                  checked={!!exp.vectorOtherEnabled}
                  onChange={(e) => onChange({ exposures: { ...exp, vectorOtherEnabled: e.target.checked } })}
                />
                <span>Other vector</span>
              </label>
              {exp.vectorOtherEnabled && (
                <>
                  <input
                    type="text"
                    placeholder="Other vector (e.g., sandflies)"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
                    value={exp.vectorOther}
                    onChange={(e) => onChange({ exposures: { ...exp, vectorOther: e.target.value } })}
                  />
                  <input
                    type="text"
                    placeholder="Please provide more details."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
                    value={exp.vectorOtherDetails}
                    onChange={(e) => onChange({ exposures: { ...exp, vectorOtherDetails: e.target.value } })}
                  />
                </>
              )}
            </div>
          </fieldset>

          {/* Water / Environment */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Water / Environment</legend>
            <ExposureCheck label="Freshwater contact" checked={exp.freshwater} details={exp.freshwaterDetails} onToggle={(v) => onChange({ exposures: { ...exp, freshwater: v } })} onDetails={(v) => onChange({ exposures: { ...exp, freshwaterDetails: v } })} />
            <ExposureCheck label="Visited caves or mines (if yes, any contact with bats or bat droppings?)" checked={exp.cavesMines} details={exp.cavesMinesDetails} onToggle={(v) => onChange({ exposures: { ...exp, cavesMines: v } })} onDetails={(v) => onChange({ exposures: { ...exp, cavesMinesDetails: v } })} />
            <ExposureCheck label="Rural / forest stay" checked={exp.ruralForest} details={exp.ruralForestDetails} onToggle={(v) => onChange({ exposures: { ...exp, ruralForest: v } })} onDetails={(v) => onChange({ exposures: { ...exp, ruralForestDetails: v } })} />
            <ExposureCheck label="Went hiking in forest, bush or woodlands" checked={exp.hikingWoodlands} details={exp.hikingWoodlandsDetails} onToggle={(v) => onChange({ exposures: { ...exp, hikingWoodlands: v } })} onDetails={(v) => onChange({ exposures: { ...exp, hikingWoodlandsDetails: v } })} />
          </fieldset>

          {/* Animal & Procedures */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Animal & Procedures</legend>
            <ExposureCheck label="Animal contact" checked={exp.animalContact} details={exp.animalContactDetails} onToggle={(v) => onChange({ exposures: { ...exp, animalContact: v } })} onDetails={(v) => onChange({ exposures: { ...exp, animalContactDetails: v } })} />
            <ExposureCheck label="Animal bite / scratch" checked={exp.animalBiteScratch} details={exp.animalBiteScratchDetails} onToggle={(v) => onChange({ exposures: { ...exp, animalBiteScratch: v } })} onDetails={(v) => onChange({ exposures: { ...exp, animalBiteScratchDetails: v } })} />
            <ExposureCheck label="Bushmeat consumption" checked={exp.bushmeat} details={exp.bushmeatDetails} onToggle={(v) => onChange({ exposures: { ...exp, bushmeat: v } })} onDetails={(v) => onChange({ exposures: { ...exp, bushmeatDetails: v } })} />
            <ExposureCheck label="Needles / tattoos / piercings" checked={exp.needlesTattoos} details={exp.needlesTattoosDetails} onToggle={(v) => onChange({ exposures: { ...exp, needlesTattoos: v } })} onDetails={(v) => onChange({ exposures: { ...exp, needlesTattoosDetails: v } })} />
            <ExposureCheck label="Safari / wildlife viewing" checked={exp.safariWildlife} details={exp.safariWildlifeDetails} onToggle={(v) => onChange({ exposures: { ...exp, safariWildlife: v } })} onDetails={(v) => onChange({ exposures: { ...exp, safariWildlifeDetails: v } })} />
          </fieldset>

          {/* Food & Water */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Food & Water</legend>
            <ExposureCheck label="Street food" checked={exp.streetFood} details={exp.streetFoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, streetFood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, streetFoodDetails: v } })} />
            <ExposureCheck label="Drank untreated water" checked={exp.untreatedWater} details={exp.untreatedWaterDetails} onToggle={(v) => onChange({ exposures: { ...exp, untreatedWater: v } })} onDetails={(v) => onChange({ exposures: { ...exp, untreatedWaterDetails: v } })} />
            <ExposureCheck label="Undercooked food" checked={exp.undercookedFood} details={exp.undercookedFoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, undercookedFood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, undercookedFoodDetails: v } })} />
            <ExposureCheck label="Undercooked seafood" checked={exp.undercookedSeafood} details={exp.undercookedSeafoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, undercookedSeafood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, undercookedSeafoodDetails: v } })} />
            <ExposureCheck label="Unpasteurised milk" checked={exp.unpasteurisedMilk} details={exp.unpasteurisedMilkDetails} onToggle={(v) => onChange({ exposures: { ...exp, unpasteurisedMilk: v } })} onDetails={(v) => onChange({ exposures: { ...exp, unpasteurisedMilkDetails: v } })} />
          </fieldset>

          {/* Institutional / Social */}
          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Institutional / Social</legend>
            <div className="grid sm:grid-cols-2 gap-2">
              <ExposureCheck label="Attended funerals" checked={exp.funerals} details={exp.funeralsDetails} onToggle={(v) => onChange({ exposures: { ...exp, funerals: v } })} onDetails={(v) => onChange({ exposures: { ...exp, funeralsDetails: v } })} />
              <ExposureCheck label="Sick contacts (including TB)" checked={exp.sickContacts} details={exp.sickContactsDetails} onToggle={(v) => onChange({ exposures: { ...exp, sickContacts: v } })} onDetails={(v) => onChange({ exposures: { ...exp, sickContactsDetails: v } })} />
              <ExposureCheck label="Healthcare facility contact" checked={exp.healthcareFacility} details={exp.healthcareFacilityDetails} onToggle={(v) => onChange({ exposures: { ...exp, healthcareFacility: v } })} onDetails={(v) => onChange({ exposures: { ...exp, healthcareFacilityDetails: v } })} />
              <ExposureCheck label="Prison contact" checked={exp.prison} details={exp.prisonDetails} onToggle={(v) => onChange({ exposures: { ...exp, prison: v } })} onDetails={(v) => onChange({ exposures: { ...exp, prisonDetails: v } })} />
              <ExposureCheck label="Refugee camp contact" checked={exp.refugeeCamp} details={exp.refugeeCampDetails} onToggle={(v) => onChange({ exposures: { ...exp, refugeeCamp: v } })} onDetails={(v) => onChange({ exposures: { ...exp, refugeeCampDetails: v } })} />
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
        <button type="button" onClick={onRemove} className={LINKISH_SECONDARY}>Remove layover</button>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Country</label>
          <input list="country-options" type="text" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={layover.country} onChange={(e) => onChange({ country: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">City</label>
          <input type="text" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={layover.city} onChange={(e) => onChange({ city: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Start</label>
          <input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={layover.start} onChange={(e) => onChange({ start: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">End</label>
          <input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={layover.end} onChange={(e) => onChange({ end: e.target.value })} />
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Did you leave the airport?</label>
          <select className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={layover.leftAirport} onChange={(e) => onChange({ leftAirport: e.target.value })}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        {layover.leftAirport === 'yes' && (
          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Please describe any activities undertaken</label>
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

// Checkbox + details helper
function ExposureCheck({ label, checked, details, onToggle, onDetails }) {
  const id = useMemo(() => uid(), []);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
        <input id={id} type="checkbox" className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700" checked={!!checked} onChange={(e) => onToggle(e.target.checked)} />
        <span>{label}</span>
      </label>
      {checked && (
        <input type="text" placeholder="Please provide more details." className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm" value={details || ''} onChange={(e) => onDetails(e.target.value)} />
      )}
    </div>
  );
}

/**
 * Timeline (Vertical)
 * - Two-column grid with 72px gutter
 * - Dashed rail centered in gutter
 * - Nodes centered over rail
 * - Renders stop (arrival node + meta text for first stop + card + departure node)
 *   and layover (start node + strip + end node). No separate tripMeta card.
 */
function TimelineVertical({ events }) {
  // Node component (10px brand with white ring)
  const Node = () => (
    <span
      className={classNames("relative z-10 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900", NODE_COLOR)}
      aria-hidden="true"
    />
  );

  return (
    <div className="relative">
      {/* Continuous dashed rail centered in the 72px gutter */}
      <div
        className="pointer-events-none absolute inset-y-0 z-0"
        style={{
          left: 36, // center of 72px gutter
          width: 0,
          borderLeftWidth: 2,
          borderLeftStyle: 'dashed',
          borderLeftColor: 'var(--rail-color, rgb(203,213,225))', // slate-300
        }}
        aria-hidden="true"
      />
      {/* dark mode rail color */}
      <style jsx>{`
        :global(html.dark) [style*="--rail-color"] {
          --rail-color: rgb(71, 85, 105); /* slate-600 */
        }
      `}</style>

      <ol
        className="grid"
        style={{ gridTemplateColumns: '72px 1fr', rowGap: '12px' }}
      >
        {events.map((ev, idx) => {
          if (ev.type === 'stop') {
            const it = ev.stop;
            return (
              <li key={`stop-${it.id}-${idx}`} className="contents">
                {/* Arrival row */}
                <div className="col-[1] z-10 flex items-center justify-center">
                  <Node />
                </div>
                <div className="col-[2]">
                  <div className="flex items-center gap-3">
                    <strong className="tabular-nums">{formatDMY(it.arrival)}</strong>
                    {it.isFirstInTrip && <span className="text-sm text-slate-600 dark:text-slate-300">— Left UK</span>}
                  </div>

                  {/* Trip meta + companions under first stop */}
                  {it.isFirstInTrip && (
                    <div className="mt-1 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
                      {it.tripPurpose ? <div><span className="font-semibold">Purpose:</span> {it.tripPurpose}</div> : null}
                      <div>
                        <span className="font-semibold">Malaria prophylaxis:</span>{' '}
                        {it.tripMalaria?.indication === 'Not indicated'
                          ? 'Not indicated'
                          : (it.tripMalaria?.took
                              ? `${it.tripMalaria.drug}${it.tripMalaria.adherence ? ` (${it.tripMalaria.adherence})` : ''}`
                              : 'Not taken')}
                      </div>
                      <div>
                        <span className="font-semibold">Vaccinations:</span>{' '}
                        {(it.tripVaccines?.length ? it.tripVaccines.join(', ') : 'None')}
                      </div>
                      {it.tripCompanions && (
                        <div>
                          <span className="font-semibold">Companions:</span>{' '}
                          {it.tripCompanions.group === 'Other'
                            ? (it.tripCompanions.otherText || 'Other')
                            : (it.tripCompanions.group || '—')}
                          {` — Well: ${
                            it.tripCompanions.companionsWell === 'yes' ? 'Yes'
                            : it.tripCompanions.companionsWell === 'no' ? 'No'
                            : 'Unknown'
                          }`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card row */}
                <div className="col-[1]" aria-hidden="true" />
                <div className="col-[2]">
                  <div className="relative z-0 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
                    {/* Country & Cities */}
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100" title={it.country || it.label}>
                      {it.country || it.label || '—'}
                    </h3>
                    {(it.cities && it.cities.filter(Boolean).length > 0) && (
                      <div className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
                        {it.cities.filter(Boolean).join(', ')}
                      </div>
                    )}

                    {/* Details grid */}
                    <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Accommodation:</span>{' '}
                        {it.accommodations?.length
                          ? (it.accommodations.includes('Other') && it.accommodationOther
                            ? [...it.accommodations.filter(a => a !== 'Other'), `Other: ${it.accommodationOther}`].join(', ')
                            : it.accommodations.join(', ')
                          )
                          : '—'}
                      </div>
                      <div className="text-sm sm:col-span-2">
                        <span className="font-medium">Exposures:</span>{' '}
                        {exposureLabels(it.exposures).length ? (
                          <ul className="mt-1 list-disc pl-5">
                            {exposureLabels(it.exposures).map((e, i) => (
                              <li key={i} className="text-sm">{e}</li>
                            ))}
                          </ul>
                        ) : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Departure row */}
                <div className="col-[1] z-10 flex items-center justify-center">
                  <Node />
                </div>
                <div className="col-[2] flex items-center gap-3">
                  <strong className="tabular-nums">{formatDMY(it.departure)}</strong>
                  {it.isLastInTrip && <span className="text-sm text-slate-600 dark:text-slate-300">— Arrived in the UK</span>}
                </div>
              </li>
            );
          }

          // Layover
          const l = ev.layover;
          return (
            <li key={`layover-${l.id}-${idx}`} className="contents">
              {/* Layover start */}
              <div className="col-[1] z-10 flex items-center justify-center">
                <Node />
              </div>
              <div className="col-[2] flex items-center gap-3">
                <strong className="tabular-nums">{formatDMY(l.start)}</strong>
                <span className="text-xs text-slate-500">Layover start</span>
              </div>

              {/* Layover strip */}
              <div className="col-[1]" aria-hidden="true" />
              <div className="col-[2]">
                <div className="mt-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                  {(l.city ? `${l.city}, ` : '') + (l.country || '')}
                  {l.leftAirport === 'yes' && l.activitiesText ? ` · ${l.activitiesText}` : ''}
                </div>
              </div>

              {/* Layover end */}
              <div className="col-[1] z-10 flex items-center justify-center">
                <Node />
              </div>
              <div className="col-[2] flex items-center gap-3">
                <strong className="tabular-nums">{formatDMY(l.end)}</strong>
                <span className="text-xs text-slate-500">Layover end</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ===== Summary builder (HTML + Plain Text) =====
function buildSummaryFromEvents(state, mergedEventsAllTrips) {
  const html = [];
  const text = [];

  html.push(`<p><strong>Travel History Summary</strong></p>`);
  text.push(`Travel History Summary`);

  // Group events back by trip for nice per-trip blocks
  const byTrip = new Map();
  mergedEventsAllTrips.forEach((ev) => {
    if (!byTrip.has(ev.tripId)) byTrip.set(ev.tripId, []);
    byTrip.get(ev.tripId).push(ev);
  });

  let tripIndex = 1;
  for (const [tripId, events] of byTrip.entries()) {
    // Compute inferred date range from stops
    const stops = events.filter((e) => e.type === 'stop').map((e) => e.stop);
    const arrivals = stops.map((s) => parseDate(s.arrival)).filter(Boolean);
    const departures = stops.map((s) => parseDate(s.departure)).filter(Boolean);
    const start = arrivals.length ? formatDMY(new Date(Math.min(...arrivals)).toISOString()) : '—';
    const end = departures.length ? formatDMY(new Date(Math.max(...departures)).toISOString()) : '—';

    html.push(`<p><strong>Trip ${tripIndex} (${start} to ${end})</strong></p>`);
    text.push(`Trip ${tripIndex} (${start} to ${end})`);

    const tripObj = state.trips.find((t) => t.id === tripId) || {};
    const vaccines = (tripObj.vaccines || []).join(', ');
    const malaria = tripObj.malaria || { indication: 'Not indicated', took: false, drug: 'None', adherence: '' };

    // Purpose
    if (tripObj.purpose && tripObj.purpose.trim()) {
      html.push(`<div><strong>Purpose:</strong> ${escapeHtml(tripObj.purpose)}</div>`);
      text.push(`Purpose: ${tripObj.purpose}`);
    }

    // Malaria
    {
      let malariaText = 'Not indicated';
      if (malaria.indication === 'Indicated') {
        malariaText = malaria.took
          ? `${malaria.drug}${malaria.adherence ? ` (${malaria.adherence})` : ''}`
          : 'Not taken';
      }
      html.push(`<div><strong>Malaria prophylaxis:</strong> ${escapeHtml(malariaText)}</div>`);
      text.push(`Malaria prophylaxis: ${malariaText}`);
    }

    // Vaccinations
    html.push(`<div><strong>Vaccinations:</strong> ${vaccines ? escapeHtml(vaccines) : 'None'}</div>`);
    text.push(`Vaccinations: ${vaccines || 'None'}`);

    // Companions (global, shown per trip)
    const cmp = state.companions || {};
    const cmpGroup = cmp.group === 'Other' ? (cmp.otherText || 'Other') : (cmp.group || '—');
    const cmpWell =
      cmp.companionsWell === 'yes' ? 'Yes' :
      cmp.companionsWell === 'no' ? 'No' : 'Unknown';
    html.push(`<div><strong>Companions:</strong> ${escapeHtml(cmpGroup)} — Well: ${cmpWell}</div>`);
    text.push(`Companions: ${cmpGroup} — Well: ${cmpWell}`);

    // Now chronological events
    let stopCounter = 0;
    events.forEach((ev) => {
      if (ev.type === 'stop') {
        stopCounter += 1;
        const s = ev.stop;
        const dates = `${formatDMY(s.arrival) || '—'} to ${formatDMY(s.departure) || '—'}`;

        // Country bold, cities next line
        const country = escapeHtml(s.country || '—');
        const cities = (s.cities || []).filter(Boolean).join(', ');
        html.push(`<div class="mt-2"><strong>Stop ${stopCounter}:</strong> ${dates}</div>`);
        text.push(`Stop ${stopCounter}: ${dates}`);

        html.push(`<div><strong>${country}</strong></div>`);
        if (cities) html.push(`<div>${escapeHtml(cities)}</div>`);

        // Accommodation line if present
        const accom = s.accommodations?.length
          ? (s.accommodations.includes('Other') && s.accommodationOther
            ? [...s.accommodations.filter(a => a !== 'Other'), `Other: ${s.accommodationOther}`].join(', ')
            : s.accommodations.join(', '))
          : '';
        if (accom) {
          html.push(`<div><strong>Accommodation:</strong> ${escapeHtml(accom)}</div>`);
          text.push(`Accommodation: ${accom}`);
        }

        // Exposures (heading + bullets)
        const bullets = exposureBullets(s.exposures);
        html.push(`<div><strong>Exposures</strong></div>`);
        text.push(`Exposures`);
        if (bullets.length) {
          html.push('<ul>');
          bullets.forEach(({ label, details }) => {
            const line = details ? `${label} — ${details}` : label;
            html.push(`<li>${escapeHtml(line)}</li>`);
            text.push(`- ${line}`);
          });
          html.push('</ul>');
        } else {
          html.push(`<div>—</div>`);
          text.push('—');
        }
      } else if (ev.type === 'layover') {
        const l = ev.layover;
        const dates = `${formatDMY(l.start) || '—'} to ${formatDMY(l.end) || '—'}`;
        const place = l.city ? `${l.city}, ${l.country}` : (l.country || '—');

        const parts = [`${place} — ${dates}`, `left airport: ${l.leftAirport}`];
        if (l.leftAirport === 'yes' && l.activitiesText) parts.push(`activities: ${l.activitiesText}`);

        html.push(`<div class="mt-2"><strong>Layover:</strong> ${escapeHtml(parts.join('; '))}</div>`);
        text.push(`Layover: ${parts.join('; ')}`);
      }
    });

    tripIndex += 1;
  }

  return { summaryHtml: html.join('\n'), summaryTextPlain: text.join('\n') };
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

// Exposure labels for the visual timeline (no details)
function exposureLabels(exp) {
  const labels = [];
  if (!exp) return labels;

  // Vector
  if (exp.mosquito) labels.push('mosquito bites');
  if (exp.tick) labels.push(cap('tick bites'));
  if (exp.vectorOtherEnabled && exp.vectorOther) labels.push(exp.vectorOther);

  // Environment
  if (exp.freshwater) labels.push('freshwater contact');
  if (exp.cavesMines) labels.push('visited caves or mines');
  if (exp.ruralForest) labels.push('rural / forest stay');
  if (exp.hikingWoodlands) labels.push('hiking in forest / bush / woodlands');

  // Animal & procedures
  if (exp.animalContact) labels.push('animal contact');
  if (exp.animalBiteScratch) labels.push('animal bite / scratch');
  if (exp.bushmeat) labels.push('bushmeat consumption');
  if (exp.needlesTattoos) labels.push('needles / tattoos / piercings');
  if (exp.safariWildlife) labels.push('safari / wildlife viewing');

  // Food & water
  if (exp.streetFood) labels.push('street food');
  if (exp.untreatedWater) labels.push('untreated water');
  if (exp.undercookedFood) labels.push('undercooked food');
  if (exp.undercookedSeafood) labels.push('undercooked seafood');
  if (exp.unpasteurisedMilk) labels.push('unpasteurised milk');

  // Social / institutional
  if (exp.funerals) labels.push('attended funerals');
  if (exp.sickContacts) labels.push('sick contacts (incl. TB)');
  if (exp.healthcareFacility) labels.push('healthcare facility contact');
  if (exp.prison) labels.push('prison contact');
  if (exp.refugeeCamp) labels.push('refugee camp contact');

  if (exp.otherText?.trim()) labels.push(exp.otherText.trim());

  return labels;
}

// Exposure bullets for the text summary (with details)
function exposureBullets(exp) {
  if (!exp) return [];
  const out = [];
  const push = (label, flag, details) => { if (flag) out.push({ label, details: details?.trim() || '' }); };

  // Vector
  push('mosquito bites', exp.mosquito, exp.mosquitoDetails);
  push('tick bites', exp.tick, exp.tickDetails);
  if (exp.vectorOtherEnabled && exp.vectorOther) out.push({ label: exp.vectorOther, details: exp.vectorOtherDetails?.trim() || '' });

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

  if (exp.otherText?.trim()) out.push({ label: exp.otherText.trim(), details: '' });

  return out;
}
