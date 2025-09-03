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
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Cities (optional)</label>
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
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Activities / Exposures (optional)</h4>

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
                    placeholder="Details (optional)"
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

      {/* Vaccines / Prophylaxis */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Pre-travel vaccinations (optional)</label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VACCINE_OPTIONS.map((v) => (
              <Checkbox key={v} label={v} checked={stop.vaccines.includes(v)} onChange={(checked) => {
                const set = new Set(stop.vaccines);
                if (checked) set.add(v); else set.delete(v);
                onChange({ vaccines: Array.from(set) });
              }} />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Malaria prophylaxis (optional)</label>
          <div className="mt-2 grid sm:grid-cols-3 gap-2">
            <div className="sm:col-span-1 flex items-center gap-2">
              <input id={`malaria-${stop.id}`} type="checkbox" className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700" checked={stop.malaria.took} onChange={(e) => onChange({ malaria: { ...stop.malaria, took: e.target.checked } })} />
              <label htmlFor={`malaria-${stop.id}`} className="text-sm text-slate-700 dark:text-slate-300">Took prophylaxis</label>
            </div>
            <div>
              <select className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={stop.malaria.drug} onChange={(e) => onChange({ malaria: { ...stop.malaria, drug: e.target.value } })} disabled={!stop.malaria.took}>
                {MALARIA_DRUGS.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
            <div>
              <select className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={stop.malaria.adherence} onChange={(e) => onChange({ malaria: { ...stop.malaria, adherence: e.target.value } })} disabled={!stop.malaria.took}>
                <option value="">Adherence…</option>
                <option value="Good">Good</option>
                <option value="Partial">Partial</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
          </div>
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
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">City (optional)</label>
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
          <>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Accommodation (optional)</label>
              <select className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={layover.accommodation} onChange={(e) => onChange({ accommodation: e.target.value })}>
                <option value="">Select…</option>
                {ACCOMMODATION_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Activities (optional)</label>
              <div className="grid grid-cols-2 gap-2">
                <Checkbox label="Ate food locally" checked={layover.activities.ateLocally} onChange={(v) => onChange({ activities: { ...layover.activities, ateLocally: v } })} />
                <Checkbox label="Used public transport" checked={layover.activities.publicTransport} onChange={(v) => onChange({ activities: { ...layover.activities, publicTransport: v } })} />
                <Checkbox label="Street food" checked={layover.activities.streetFood} onChange={(v) => onChange({ activities: { ...layover.activities, streetFood: v } })} />
                <Checkbox label="Drank untreated water" checked={layover.activities.untreatedWater} onChange={(v) => onChange({ activities: { ...layover.activities, untreatedWater: v } })} />
              </div>
            </div>
          </>
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
        <input type="text" placeholder="Details (optional)" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm" value={details || ''} onChange={(e) => onDetails(e.target.value)} />
      )}
    </div>
  );
}

/**
 * Timeline (Vertical) — two-column grid gutter approach
 * - Grid with fixed left column (gutter) + fluid right column (content)
 * - Dashed rail centered in gutter, behind content
 * - Nodes (10px, white ring) centered in gutter above the rail
 * - Events merged in chronological order: stops (arrival/card/departure) and layovers (start/strip/end)
 */
function TimelineVertical({ stops, layovers }) {
  // Build merged chronological events per trip
  const events = useMemo(() => {
    // Group by trip
    const byTrip = new Map();
    stops.forEach((s) => {
      if (!byTrip.has(s.tripId)) byTrip.set(s.tripId, { stops: [], layovers: [] });
      byTrip.get(s.tripId).stops.push(s);
    });
    layovers.forEach((l) => {
      if (!byTrip.has(l.tripId)) byTrip.set(l.tripId, { stops: [], layovers: [] });
      byTrip.get(l.tripId).layovers.push(l);
    });

    const merged = [];
    for (const [tripId, { stops: st, layovers: ly }] of byTrip.entries()) {
      const sortedStops = [...st].sort((a, b) => (parseDate(a.arrival) - parseDate(b.arrival)));
      const sortedLayovers = [...ly].sort((a, b) => (parseDate(a.start) - parseDate(b.start)));

      // Build unified list keyed by "lead" date
      const items = [
        ...sortedStops.map((s) => ({ type: 'stop', date: parseDate(s.arrival), stop: s })),
        ...sortedLayovers.map((l) => ({ type: 'layover', date: parseDate(l.start), layover: l })),
      ].sort((a, b) => (a.date - b.date));

      merged.push(...items.map((x) => ({ ...x, tripId })));
    }

    // Sort across trips as well
    merged.sort((a, b) => (a.date - b.date));
    return merged;
  }, [stops, layovers]);

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
                <div className="col-[2] flex items-center gap-3">
                  <strong className="tabular-nums">{formatDMY(it.arrival)}</strong>
                  {it.isFirstInTrip && <span className="text-sm text-slate-600 dark:text-slate-300">— Left UK</span>}
                </div>

                {/* Purpose row */}
                {it.isFirstInTrip && it.tripPurpose && (
                  <>
                    <div className="col-[1]" aria-hidden="true" />
                    <div className="col-[2] -mt-2 mb-1 text-xs text-slate-500 dark:text-slate-400">
                      Purpose: {it.tripPurpose}
                    </div>
                  </>
                )}

                {/* Card row */}
                <div className="col-[1]" aria-hidden="true" />
                <div className="col-[2]">
                  <div className="relative z-0 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate" title={it.label}>{it.label}</h3>
                    </div>

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
                      <div className="text-sm">
                        <span className="font-medium">Vaccines:</span>{' '}
                        {it.vaccines?.length ? it.vaccines.join(', ') : '—'}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Malaria prophylaxis:</span>{' '}
                        {it.malaria?.took ? `${it.malaria.drug}${it.malaria.adherence ? ` (${it.malaria.adherence})` : ''}` : 'No'}
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
          } else {
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
                    {l.leftAirport === 'yes' && l.accommodation ? ` · ${l.accommodation}` : ''}
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
          }
        })}
      </ol>
    </div>
  );
}

// ---- Summary builder ----
function buildSummary(state) {
  const lines = [];
  lines.push('Travel History Summary');

  state.trips.forEach((trip, idx) => {
    // Infer trip range from stops
    const arrivals = trip.stops.map((s) => parseDate(s.arrival)).filter(Boolean);
    const departures = trip.stops.map((s) => parseDate(s.departure)).filter(Boolean);
    const start = arrivals.length ? formatDMY(new Date(Math.min(...arrivals)).toISOString()) : '—';
    const end = departures.length ? formatDMY(new Date(Math.max(...departures)).toISOString()) : '—';

    const headerParts = [`Trip ${idx + 1} (${start} to ${end})`];
    if (trip.purpose) headerParts.push(`purpose: ${trip.purpose}`);
    lines.push(headerParts.join(' · '));

    // Chronological stops
    const sortedStops = [...trip.stops].sort((a, b) => (parseDate(a.arrival) - parseDate(b.arrival)));
    sortedStops.forEach((s, sIdx) => {
      const dates = [s.arrival ? formatDMY(s.arrival) : '—', s.departure ? formatDMY(s.departure) : '—'].join(' to ');
      const cityLabel = (s.cities || []).filter(Boolean).join(', ');
      const place = s.country ? (cityLabel ? `${cityLabel}, ${s.country}` : s.country) : cityLabel || '—';

      const extras = [];
      if (s.accommodations?.length)
        extras.push(
          `accommodation: ${s.accommodations.join(', ')}${s.accommodations.includes('Other') && s.accommodationOther ? ` (Other: ${s.accommodationOther})` : ''}`
        );
      if (s.vaccines?.length) extras.push(`vaccinations: ${s.vaccines.join(', ')}`);
      if (s.malaria?.took)
        extras.push(
          `malaria prophylaxis: ${s.malaria.drug}${s.malaria.adherence ? ` (adherence: ${s.malaria.adherence})` : ''}`
        );

      lines.push(`  • Stop ${sIdx + 1}: ${place} — ${dates}${extras.length ? `; ${extras.join('; ')}` : ''}`);

      // Exposures (bullets)
      const bullets = exposureBullets(s.exposures);
      if (bullets.length) {
        bullets.forEach(({ label, details }) => {
          lines.push(`      - ${label}${details ? ` — ${details}` : ''}`);
        });
      }
    });

    // Chronological layovers
    const sortedLayovers = [...trip.layovers].sort((a, b) => (parseDate(a.start) - parseDate(b.start)));
    if (sortedLayovers.length) {
      lines.push('  • Layovers:');
      sortedLayovers.forEach((l) => {
        const dates = [l.start ? formatDMY(l.start) : '—', l.end ? formatDMY(l.end) : '—'].join(' to ');
        const place = l.city ? `${l.city}, ${l.country}` : l.country || '—';
        const parts = [`${place} — ${dates}`];
        parts.push(`left airport: ${l.leftAirport}`);
        if (l.leftAirport === 'yes') {
          const acts = [];
          if (l.activities.ateLocally) acts.push('ate locally');
          if (l.activities.publicTransport) acts.push('public transport');
          if (l.activities.streetFood) acts.push('street food');
          if (l.activities.untreatedWater) acts.push('untreated water');
          if (l.accommodation) acts.push(`accommodation: ${l.accommodation}`);
          if (acts.length) parts.push(acts.join(', '));
        }
        lines.push(`    - ${parts.join('; ')}`);
      });
    }
  });

  if (state.companions) {
    const c = state.companions;
    const who = c.group === 'Other' && c.otherText ? c.otherText : c.group;
    lines.push(`Companions: ${who}; companions well: ${c.companionsWell}`);
  }

  return lines.join('\n');
}

// Exposure labels for the visual timeline (no details)
function exposureLabels(exp) {
  const labels = [];
  if (!exp) return labels;

  // Vector
  if (exp.mosquito) labels.push('mosquito bites');
  if (exp.tick) labels.push('tick bites');
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
