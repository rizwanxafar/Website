'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v11
// - Node alignment: first node aligns with "Left UK" (arrival date row); meta block in its own row
// - Exposure detail inputs say "Please provide more details."
// - Exposures capitalised in visual & text summaries
// - Print CSS hardened via #timeline-root (no blank-page prints)
// - Companions included in visual and text summaries
// - Stops numbered in text summary

import { useEffect, useMemo, useRef, useState } from 'react';

// ---- Minimal countries stub ----
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

const LINKISH_SECONDARY =
  "rounded-lg px-3 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))] transition";

const NODE_COLOR = "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))]";

// ---- Persistence ----
const LS_KEY = 'travel-history-generator:v11';

// ---- Helpers ----
const uid = () => Math.random().toString(36).slice(2, 9);
const classNames = (...parts) => parts.filter(Boolean).join(' ');

// robust date parsing
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

// DD/MM/YYYY
const formatDMY = (dateStr) => {
  const d = parseDate(dateStr);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const capitaliseFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Overlap check (same-day edges allowed)
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
  cities: [''],
  arrival: '',
  departure: '',
  accommodations: [],
  accommodationOther: '',
  exposures: {
    mosquito: false, mosquitoDetails: '',
    tick: false, tickDetails: '',
    vectorOtherEnabled: false, vectorOther: '', vectorOtherDetails: '',
    freshwater: false, freshwaterDetails: '',
    cavesMines: false, cavesMinesDetails: '',
    ruralForest: false, ruralForestDetails: '',
    hikingWoodlands: false, hikingWoodlandsDetails: '',
    animalContact: false, animalContactDetails: '',
    animalBiteScratch: false, animalBiteScratchDetails: '',
    bushmeat: false, bushmeatDetails: '',
    needlesTattoos: false, needlesTattoosDetails: '',
    safariWildlife: false, safariWildlifeDetails: '',
    streetFood: false, streetFoodDetails: '',
    untreatedWater: false, untreatedWaterDetails: '',
    undercookedFood: false, undercookedFoodDetails: '',
    undercookedSeafood: false, undercookedSeafoodDetails: '',
    unpasteurisedMilk: false, unpasteurisedMilkDetails: '',
    funerals: false, funeralsDetails: '',
    largeGatherings: false, largeGatheringsDetails: '',
    sickContacts: false, sickContactsDetails: '',
    healthcareFacility: false, healthcareFacilityDetails: '',
    prison: false, prisonDetails: '',
    refugeeCamp: false, refugeeCampDetails: '',
    otherText: '',
  },
});

const emptyLayover = (tripId) => ({
  id: uid(), tripId, country: '', city: '', start: '', end: '', leftAirport: 'no',
  activitiesText: '',
});

const emptyTrip = () => ({
  id: uid(),
  purpose: '',
  vaccines: [],
  malaria: { indication: 'Not indicated', took: false, drug: 'None', adherence: '' },
  stops: [emptyStop()],
  layovers: [],
});

const initialState = {
  trips: [emptyTrip()],
  companions: { group: 'Alone', otherText: '', companionsWell: 'unknown' },
};

// ---- Exposure labels for visual timeline (capitalised) ----
function exposureLabels(exp) {
  const labels = [];
  if (!exp) return labels;
  if (exp.mosquito) labels.push('Mosquito bites');
  if (exp.tick) labels.push('Tick bites');
  if (exp.vectorOtherEnabled && exp.vectorOther) labels.push(capitaliseFirst(exp.vectorOther));
  if (exp.freshwater) labels.push('Freshwater contact');
  if (exp.cavesMines) labels.push('Visited caves or mines');
  if (exp.ruralForest) labels.push('Rural / forest stay');
  if (exp.hikingWoodlands) labels.push('Hiking in forest / bush / woodlands');
  if (exp.animalContact) labels.push('Animal contact');
  if (exp.animalBiteScratch) labels.push('Animal bite / scratch');
  if (exp.bushmeat) labels.push('Bushmeat consumption');
  if (exp.needlesTattoos) labels.push('Needles / tattoos / piercings');
  if (exp.safariWildlife) labels.push('Safari / wildlife viewing');
  if (exp.streetFood) labels.push('Street food');
  if (exp.untreatedWater) labels.push('Untreated water');
  if (exp.undercookedFood) labels.push('Undercooked food');
  if (exp.undercookedSeafood) labels.push('Undercooked seafood');
  if (exp.unpasteurisedMilk) labels.push('Unpasteurised milk');
  if (exp.funerals) labels.push('Attended funerals');
  if (exp.sickContacts) labels.push('Sick contacts (incl. TB)');
  if (exp.healthcareFacility) labels.push('Healthcare facility contact');
  if (exp.prison) labels.push('Prison contact');
  if (exp.refugeeCamp) labels.push('Refugee camp contact');
  if (exp.otherText?.trim()) labels.push(capitaliseFirst(exp.otherText.trim()));
  return labels;
}

// ---- Print styles component (for timeline-only printing) ----
const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      body.print-timeline-only * { display: none !important; }
      body.print-timeline-only #timeline-root { display: block !important; }
    }
  `}</style>
);

// ===== Chronology builder (used by timeline and summary) =====
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
        betweenByIndex[i].push(l);
        placed = true;
        break;
      }
    }
    if (!placed) (sTime && sTime < parseDate(firstStop.arrival) ? beforeFirst : afterLast).push(l);
  }

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

  // Validation: strict overlaps (same day edges allowed)
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
    if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const t = setTimeout(() => setPendingScrollId(null), 600);
    return () => clearTimeout(t);
  }, [pendingScrollId]);

  // Derived: merged chronology across all trips
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

  // Build summary HTML & plain text using same chronology
  const { summaryHtml, summaryTextPlain } = useMemo(
    () => buildSummaryFromEvents(state, mergedEventsAllTrips),
    [state, mergedEventsAllTrips]
  );

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
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-semibold bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))]">{idx + 1}</span>
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

      {/* Timeline (wrapped in #timeline-root in Part 3) will be inserted below */}
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

            {/* Took? */}
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
            <ExposureCheck label="Hiking in forest / bush / woodlands" checked={exp.hikingWoodlands} details={exp.hikingWoodlandsDetails} onToggle={(v) => onChange({ exposures: { ...exp, hikingWoodlands: v } })} onDetails={(v) => onChange({ exposures: { ...exp, hikingWoodlandsDetails: v } })} />
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
        <input
          type="text"
          placeholder="Please provide more details."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm"
          value={details || ''}
          onChange={(e) => onDetails(e.target.value)}
        />
      )}
    </div>
  );
}
      
/* ===================== Timeline Vertical ===================== */
function TimelineVertical({ events }) {
  // The rail is a two-column grid: [gutter 72px | content]
  // We render rows:
  //  - Stop arrival row: node + "DD/MM/YYYY — Left UK"
  //  - Meta row (only for first stop of trip): empty gutter + purpose/malaria/vaccines/companions
  //  - Card row: empty gutter + country card
  //  - Stop departure row (only for last stop of trip): node + "DD/MM/YYYY — Arrived in the UK"
  //  - Layovers are inline rows with a diamond marker on the rail

  return (
    <div className="relative">
      {/* Rail */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[36px] top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-700"
      />
      <ol className="relative space-y-4">
        {events.map((ev, idx) => {
          if (ev.type === 'layover') {
            const l = ev.layover;
            const label = `${[l.city, l.country].filter(Boolean).join(', ') || 'Layover'}${
              l.start || l.end ? ` (${formatDMY(l.start)}${l.end ? ` → ${formatDMY(l.end)}` : ''})` : ''
            }${l.leftAirport === 'yes' && l.activitiesText ? ` — ${l.activitiesText}` : ''}`;

            return (
              <li key={`lay-${l.id}-${idx}`} className="grid grid-cols-[72px,1fr] items-start">
                {/* Gutter: diamond marker */}
                <div className="relative h-4">
                  <span
                    className={classNames(
                      "absolute left-1/2 -translate-x-1/2 top-1 inline-block h-3 w-3 rotate-45",
                      NODE_COLOR
                    )}
                    aria-hidden="true"
                  />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 pt-0.5">{label}</div>
              </li>
            );
          }

          // stops
          const s = ev.stop;
          const country = s.country || '—';
          const cities = (s.cities || []).filter(Boolean);
          const exposures = exposureLabels(s.exposures);

          return (
            <li key={`stop-${s.id}-${idx}`} className="space-y-2">
              {/* Arrival row: node + Left UK date */}
              <div className="grid grid-cols-[72px,1fr] items-start">
                <div className="relative h-6">
                  <span
                    className={classNames(
                      "absolute left-1/2 -translate-x-1/2 -top-1 inline-flex items-center justify-center rounded-full h-5 w-5 ring-4 ring-white dark:ring-slate-950",
                      NODE_COLOR
                    )}
                    aria-hidden="true"
                  />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatDMY(s.arrival)} — Left UK
                </div>
              </div>

              {/* Meta row (only first stop of trip) */}
              {s.isFirstInTrip && (
                <div className="grid grid-cols-[72px,1fr]">
                  <div />
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1">
                    {s.tripPurpose && (
                      <div><span className="font-semibold">Purpose:</span> {s.tripPurpose}</div>
                    )}
                    <div>
                      <span className="font-semibold">Malaria prophylaxis:</span>{' '}
                      {s.tripMalaria?.indication === 'Not indicated'
                        ? 'Not indicated'
                        : (s.tripMalaria?.took
                            ? `${s.tripMalaria.drug}${s.tripMalaria.adherence ? ` (${s.tripMalaria.adherence})` : ''}`
                            : 'Indicated, not taken')}
                    </div>
                    <div>
                      <span className="font-semibold">Vaccinations:</span>{' '}
                      {s.tripVaccines?.length ? s.tripVaccines.join(', ') : '—'}
                    </div>
                    <div>
                      <span className="font-semibold">Companions:</span>{' '}
                      {renderCompanionsInline(s.tripCompanions)}
                    </div>
                  </div>
                </div>
              )}

              {/* Country card */}
              <div className="grid grid-cols-[72px,1fr] items-stretch">
                <div />{/* empty gutter to avoid a node on this row */}
                <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
                  <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{country}</div>
                  {cities.length > 0 && (
                    <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {cities.join(', ')}
                    </div>
                  )}
                  {/* Details grid */}
                  <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                    <div className="text-sm"><span className="font-medium">Accommodation:</span> {(s.accommodations || []).length ? s.accommodations.join(', ') : '—'}</div>
                    <div className="text-sm sm:col-span-2">
                      <span className="font-medium">Exposures:</span>{' '}
                      {exposures.length ? (
                        <ul className="mt-1 list-disc pl-5">
                          {exposures.map((e, i) => (
                            <li key={i} className="text-sm">{e}</li>
                          ))}
                        </ul>
                      ) : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Departure row (only for last stop of trip) */}
              {s.isLastInTrip && s.departure && (
                <div className="grid grid-cols-[72px,1fr] items-start">
                  <div className="relative h-6">
                    <span
                      className={classNames(
                        "absolute left-1/2 -translate-x-1/2 -top-1 inline-flex items-center justify-center rounded-full h-5 w-5 ring-4 ring-white dark:ring-slate-950",
                        NODE_COLOR
                      )}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatDMY(s.departure)} — Arrived in the UK
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ============== Summary Builder (HTML + plain text) ============== */
function buildSummaryFromEvents(state, events) {
  // Build text in the same chronological order as events
  // Stops are numbered per trip in the order they appear within that trip.
  const stopCounters = new Map(); // tripId => count

  const lines = [];
  const html = [];

  lines.push('Travel History Summary');
  html.push('<p><strong>Travel History Summary</strong></p>');

  // Companions overall line (optional)
  if (state.companions) {
    const compStr = renderCompanionsInline(state.companions);
    if (compStr) {
      lines.push(`Companions: ${compStr}`);
      html.push(`<p><strong>Companions:</strong> ${escapeHtml(compStr)}</p>`);
    }
  }

  // We need to emit trip-level meta (Purpose/Malaria/Vaccinations) before the first stop of each trip.
  const emittedTripMeta = new Set();

  for (const ev of events) {
    if (ev.type === 'layover') {
      const l = ev.layover;
      const layStr = `${[l.city, l.country].filter(Boolean).join(', ') || 'Layover'}${
        l.start || l.end ? ` (${formatDMY(l.start)}${l.end ? ` → ${formatDMY(l.end)}` : ''})` : ''
      }${l.leftAirport === 'yes' && l.activitiesText ? ` — ${l.activitiesText}` : ''}`;

      lines.push(`Layover: ${layStr}`);
      html.push(`<p><em>Layover:</em> ${escapeHtml(layStr)}</p>`);
      continue;
    }

    // stop
    const s = ev.stop;
    const tripId = ev.tripId;
    if (!emittedTripMeta.has(tripId)) {
      emittedTripMeta.add(tripId);

      if (s.tripPurpose) {
        lines.push(`Purpose: ${s.tripPurpose}`);
        html.push(`<p><strong>Purpose:</strong> ${escapeHtml(s.tripPurpose)}</p>`);
      }

      const malStr =
        s.tripMalaria?.indication === 'Not indicated'
          ? 'Not indicated'
          : (s.tripMalaria?.took
              ? `${s.tripMalaria.drug}${s.tripMalaria.adherence ? ` (${s.tripMalaria.adherence})` : ''}`
              : 'Indicated, not taken');
      lines.push(`Malaria prophylaxis: ${malStr}`);
      html.push(`<p><strong>Malaria prophylaxis:</strong> ${escapeHtml(malStr)}</p>`);

      const vacStr = (s.tripVaccines && s.tripVaccines.length) ? s.tripVaccines.join(', ') : '—';
      lines.push(`Vaccinations: ${vacStr}`);
      html.push(`<p><strong>Vaccinations:</strong> ${escapeHtml(vacStr)}</p>`);
    }

    // stop numbering per trip
    const prev = stopCounters.get(tripId) || 0;
    const num = prev + 1;
    stopCounters.set(tripId, num);

    const country = s.country || '—';
    const cities = (s.cities || []).filter(Boolean);
    const head = `Stop ${num} — ${formatDMY(s.arrival)} to ${formatDMY(s.departure)}`;
    lines.push(head);
    html.push(`<p><strong>${escapeHtml(head)}</strong></p>`);

    // Country line, then cities on next line
    lines.push(`  ${country}`);
    html.push(`<p><strong>${escapeHtml(country)}</strong></p>`);
    if (cities.length) {
      lines.push(`  ${cities.join(', ')}`);
      html.push(`<p>${escapeHtml(cities.join(', '))}</p>`);
    }

    // Accommodation
    const accStr = (s.accommodations || []).length ? s.accommodations.join(', ') : '—';
    lines.push(`  Accommodation: ${accStr}`);
    html.push(`<p><strong>Accommodation:</strong> ${escapeHtml(accStr)}</p>`);

    // Exposures
    const labels = exposureLabels(s.exposures);
    lines.push('  Exposures:');
    html.push('<p><strong>Exposures:</strong></p>');
    if (labels.length) {
      for (const lab of labels) {
        lines.push(`    - ${lab}`);
        html.push(`<ul><li>${escapeHtml(lab)}</li></ul>`);
      }
    } else {
      lines.push('    - —');
      html.push('<p>—</p>');
    }
  }

  return {
    summaryTextPlain: lines.join('\n'),
    summaryHtml: html.join('\n')
  };
}

/* ===================== Helpers for summary ===================== */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderCompanionsInline(c) {
  if (!c) return '';
  const group = c.group === 'Other' && c.otherText ? c.otherText : c.group;
  const well =
    c.companionsWell === 'yes' ? 'Yes' :
    c.companionsWell === 'no' ? 'No' : 'Unknown';
  if (!group && !well) return '';
  if (group && well) return `${group}; well: ${well}`;
  return group || well || '';
}
