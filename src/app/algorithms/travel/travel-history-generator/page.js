'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v7 (chronological layovers, strict overlap validation, auto-scroll, exposure tweaks)
// - Theme tokens (brand/accent) applied throughout
// - Visual timeline shows stops and layovers in strict chronological order
// - Same-day edges allowed; otherwise overlaps are errors
// - Auto-scrolls to newly added trip/stop/layover

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
const LS_KEY = 'travel-history-generator:v7';

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
    mosquito: false, mosquitoDetails: '',         // label: Mosquito bites
    tick: false, tickDetails: '',                 // label: Tick bites
    vectorOtherEnabled: false, vectorOther: '', vectorOtherDetails: '',
    // Environment
    freshwater: false, freshwaterDetails: '',
    cavesMines: false, cavesMinesDetails: '',     // label: Visited caves or mines (...)
    ruralForest: false, ruralForestDetails: '',   // label unchanged: Rural / forest stay
    hikingWoodlands: false, hikingWoodlandsDetails: '', // NEW: Went hiking in forest, bush or woodlands
    // Animal / procedures
    animalContact: false, animalContactDetails: '',
    animalBiteScratch: false, animalBiteScratchDetails: '',
    bushmeat: false, bushmeatDetails: '',         // label: Bushmeat consumption
    needlesTattoos: false, needlesTattoosDetails: '',
    // Food / water
    streetFood: false, streetFoodDetails: '',
    untreatedWater: false, untreatedWaterDetails: '',
    undercookedFood: false, undercookedFoodDetails: '',
    undercookedSeafood: false, undercookedSeafoodDetails: '',
    unpasteurisedMilk: false, unpasteurisedMilkDetails: '',
    // Social / institutional
    funerals: false, funeralsDetails: '',         // Attended funerals
    largeGatherings: false, largeGatheringsDetails: '',
    sickContacts: false, sickContactsDetails: '', // NEW: Sick contacts (including TB)
    healthcareFacility: false, healthcareFacilityDetails: '',
    prison: false, prisonDetails: '',
    refugeeCamp: false, refugeeCampDetails: '',
    // Misc
    safariWildlife: false, safariWildlifeDetails: '',
    otherText: '',
  },

  vaccines: [],
  malaria: { took: false, drug: 'None', adherence: '' },
});

const emptyLayover = (tripId) => ({
  id: uid(), tripId, country: '', city: '', start: '', end: '', leftAirport: 'no', accommodation: '',
  activities: { ateLocally: false, publicTransport: false, streetFood: false, untreatedWater: false },
});

const emptyTrip = () => ({ id: uid(), purpose: '', stops: [emptyStop()], layovers: [] });

const initialState = {
  trips: [emptyTrip()],
  companions: { group: 'Alone', otherText: '', companionsWell: 'unknown' }, // yes | no | unknown
};

// ---- Main Page Component ----
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

  // Derived — stops with flags and layovers (for timeline & summary)
  const stopsWithFlags = useMemo(() => {
    const out = [];
    state.trips.forEach((trip) => {
      const sorted = [...trip.stops].sort((a, b) => {
        const da = parseDate(a.arrival), db = parseDate(b.arrival);
        if (!da && !db) return 0; if (!da) return 1; if (!db) return -1; return da - db;
      });
      const first = sorted[0]?.id;
      const last = sorted[sorted.length - 1]?.id;

      sorted.forEach((s) => {
        const cityLabel = (s.cities || []).filter(Boolean).join(', ');
        const place = s.country ? (cityLabel ? `${cityLabel}, ${s.country}` : s.country) : cityLabel || '—';
        out.push({
          tripId: trip.id,
          tripPurpose: trip.purpose || '',
          isFirstInTrip: s.id === first,
          isLastInTrip: s.id === last,
          id: s.id,
          label: place,
          country: s.country,
          cities: s.cities,
          arrival: s.arrival,
          departure: s.departure,
          exposures: s.exposures,
          accommodations: s.accommodations,
          accommodationOther: s.accommodationOther,
          vaccines: s.vaccines,
          malaria: s.malaria,
        });
      });
    });

    out.sort((a, b) => {
      const da = parseDate(a.arrival), db = parseDate(b.arrival);
      if (!da && !db) return 0; if (!da) return 1; if (!db) return -1; return da - db;
    });
    return out;
  }, [state.trips]);

  const timelineLayovers = useMemo(() => {
    const layovers = [];
    state.trips.forEach((trip) => {
      trip.layovers.forEach((l) => layovers.push({ ...l, tripId: trip.id }));
    });
    layovers.sort((a, b) => {
      const da = parseDate(a.start), db = parseDate(b.start);
      if (!da && !db) return 0; if (!da) return 1; if (!db) return -1; return da - db;
    });
    return layovers;
  }, [state.trips]);

  const summaryText = useMemo(() => buildSummary(state), [state]);

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
            Build a clear, printable travel history. <strong>No clinical risk assessment.</strong>
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
          <button
            type="button"
            onClick={handlePrintTimeline}
            className={BTN_SECONDARY}
          >
            Print timeline
          </button>
        </div>
        <TimelineVertical stops={stopsWithFlags} layovers={timelineLayovers} />
      </section>

      {/* Text summary */}
      <section className="mt-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Text summary</h2>
        <textarea readOnly className="w-full min-h-[240px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={summaryText} />
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => navigator.clipboard.writeText(summaryText)} className={BTN_SECONDARY}>Copy summary</button>
        </div>
      </section>

      {/* About modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAbout(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">About this tool</h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">This generator creates a travel history summary (text + timeline). No clinical risk assessment is performed. Data is stored only in your browser for this session. Do not enter private or patient-identifiable information.</p>
            <div className="mt-4 text-right">
              <button type="button" onClick={() => setShowAbout(false)} className={BTN_SECONDARY + " text-sm px-3 py-2"}>Close</button>
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
        /* Print only timeline when body has .print-timeline-only */
        @media print {
          body.print-timeline-only * { visibility: hidden !important; }
          body.print-timeline-only .tl-printable,
          body.print-timeline-only .tl-printable * { visibility: visible !important; }
          body.print-timeline-only .tl-printable { position: absolute !important; inset: 0 !important; width: 100% !important; }
        }
      `}</style>
    </main>
  );
}

// ---- Trip Card ----
function TripCard({
  trip, index, updateTrip, updateStop, addStop, removeStop, addLayover, updateLayover, removeLayover, removeTrip,
  highlight, setItemRef, innerRef
}) {
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

      {/* Trip meta */}
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3">
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Purpose (optional)</label>
          <input type="text" placeholder="Work, VFR, tourism, humanitarian, etc." className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={trip.purpose} onChange={(e) => updateTrip(trip.id, { purpose: e.target.value })} />
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
