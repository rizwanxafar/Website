'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v1 (Card Rail)
// - Client-only. Session restore via localStorage. No server storage.
// - Output = text summary + visual Card Rail timeline (print-optimised).
// - Countries currently a stubbed datalist; swap to ISO dataset later.

import { useEffect, useMemo, useState } from 'react';

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

// ---- Persistence ----
const LS_KEY = 'travel-history-generator:v1';

// ---- Helpers ----
const uid = () => Math.random().toString(36).slice(2, 9);
const classNames = (...parts) => parts.filter(Boolean).join(' ');
const toISO = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};
// Overlap check (same-day edges allowed)
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  const aS = parseDate(aStart), aE = parseDate(aEnd), bS = parseDate(bStart), bE = parseDate(bEnd);
  if (!aS || !aE || !bS || !bE) return false;
  return aS < bE && bS < aE;
}

// ---- Initial State ----
const emptyStop = () => ({
  id: uid(), country: '', city: '', arrival: '', departure: '',
  accommodation: '', accommodationOther: '',
  exposures: {
    mosquito: false, tick: false, vectorOther: '', freshwater: false, cavesMines: false, ruralForest: false,
    animalContact: false, animalBiteScratch: false, bushmeat: false, needlesTattoos: false,
    funerals: false, largeGatherings: false,
    streetFood: false, untreatedWater: false, undercookedFood: false, undercookedSeafood: false,
    healthcareFacility: false, prison: false, refugeeCamp: false, otherText: '',
  },
  vaccines: [],
  malaria: { took: false, drug: 'None', adherence: '' },
});

const emptyLayover = () => ({
  id: uid(), country: '', city: '', start: '', end: '', leftAirport: 'no', accommodation: '',
  activities: { ateLocally: false, publicTransport: false, streetFood: false, untreatedWater: false },
});

const emptyTrip = () => ({ id: uid(), startDate: '', endDate: '', purpose: '', stops: [emptyStop()], layovers: [] });

const initialState = {
  trips: [emptyTrip()],
  companions: { group: 'Alone', otherText: '', companionsWell: 'unknown' }, // yes | no | unknown
  visualStyle: 'cards',
};

// ---- Main Page Component ----
export default function TravelHistoryGeneratorPage() {
  const [state, setState] = useState(initialState);
  const [showAbout, setShowAbout] = useState(false);
  const [issues, setIssues] = useState([]);

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

  // Validation: only real conflicts
  useEffect(() => {
    const list = [];
    state.trips.forEach((trip, tIdx) => {
      if (trip.startDate && trip.endDate) {
        const s = parseDate(trip.startDate), e = parseDate(trip.endDate);
        if (s && e && s > e) list.push({ level: 'error', msg: `Trip ${tIdx + 1}: Start date is after end date.` });
      }
      trip.stops.forEach((s, sIdx) => {
        if (s.arrival && s.departure) {
          const a = parseDate(s.arrival), d = parseDate(s.departure);
          if (a && d && a > d) list.push({ level: 'error', msg: `Trip ${tIdx + 1}, Stop ${sIdx + 1}: Arrival is after departure.` });
        }
      });
      for (let i = 0; i < trip.stops.length; i++) {
        for (let j = i + 1; j < trip.stops.length; j++) {
          const A = trip.stops[i], B = trip.stops[j];
          if (rangesOverlap(A.arrival, A.departure, B.arrival, B.departure)) {
            list.push({ level: 'warn', msg: `Trip ${tIdx + 1}: Stops ${i + 1} and ${j + 1} overlap; please check dates.` });
          }
        }
      }
    });
    setIssues(list);
  }, [state.trips]);

  // Derived — flatted/sorted stops & layovers for the rail
  const timelineStops = useMemo(() => {
    const stops = [];
    state.trips.forEach((trip) => {
      trip.stops.forEach((s) => {
        stops.push({
          id: s.id,
          label: s.city ? `${s.city}, ${s.country}` : s.country || '—',
          country: s.country, city: s.city, arrival: s.arrival, departure: s.departure,
          exposures: s.exposures, accommodation: s.accommodation, vaccines: s.vaccines, malaria: s.malaria,
        });
      });
    });
    stops.sort((a, b) => {
      const da = parseDate(a.arrival), db = parseDate(b.arrival);
      if (!da && !db) return 0; if (!da) return 1; if (!db) return -1; return da - db;
    });
    return stops;
  }, [state.trips]);

  const timelineLayovers = useMemo(() => {
    const layovers = [];
    state.trips.forEach((trip) => {
      trip.layovers.forEach((l) => layovers.push({ ...l }));
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

  const addTrip = () => setState((p) => ({ ...p, trips: [...p.trips, emptyTrip()] }));
  const removeTrip = (tripId) => setState((p) => ({ ...p, trips: p.trips.filter((t) => t.id !== tripId) }));

  const addStop = (tripId) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: [...t.stops, emptyStop()] } : t)) }));
  const removeStop = (tripId, stopId) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: t.stops.filter((s) => s.id !== stopId) } : t)) }));

  const addLayover = (tripId) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: [...t.layovers, emptyLayover()] } : t)) }));
  const updateLayover = (tripId, layoverId, patch) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: t.layovers.map((l) => (l.id === layoverId ? { ...l, ...patch } : l)) } : t)) }));
  const removeLayover = (tripId, layoverId) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, layovers: t.layovers.filter((l) => l.id !== layoverId) } : t)) }));

  const clearAll = () => {
    if (confirm('Clear all data? This only affects this browser/session.')) {
      localStorage.removeItem(LS_KEY);
      setState(initialState);
    }
  };
  const printPage = () => window.print();

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
          <button type="button" onClick={() => setShowAbout(true)} className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400">About</button>
          <button type="button" onClick={printPage} className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400">Print / PDF</button>
          <button type="button" onClick={clearAll} className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400">Clear all</button>
        </div>
      </header>

      {/* Privacy banner */}
      <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-4 text-amber-900 dark:text-amber-200">
        <p className="text-sm"><strong>Privacy:</strong> No data is stored on our servers. This tool uses your browser storage only. Do <strong>not</strong> enter private or patient‑identifiable information.</p>
      </div>

      {/* Validation messages */}
      {issues.length > 0 && (
        <div className="mb-6 space-y-2">
          {issues.map((e, i) => (
            <div key={i} className={classNames('rounded-lg border px-3 py-2 text-sm', e.level === 'error' ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-200' : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-600/60 dark:bg-amber-900/20 dark:text-amber-200')}>
              {e.msg}
            </div>
          ))}
        </div>
      )}

      {/* Stepper */}
      <ol className="mb-8 grid gap-4 sm:grid-cols-5">
        {['Trip meta', 'Countries & stops', 'Layovers', 'Companions', 'Review & generate'].map((label, idx) => (
          <li key={label} className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-semibold">{idx + 1}</span>
            <span className="text-slate-800 dark:text-slate-200">{label}</span>
          </li>
        ))}
      </ol>

      {/* Trip Builder */}
      <section className="space-y-10">
        {state.trips.map((trip, tIdx) => (
          <TripCard key={trip.id} trip={trip} index={tIdx} updateTrip={updateTrip} updateStop={updateStop} addStop={addStop} removeStop={removeStop} addLayover={addLayover} updateLayover={updateLayover} removeLayover={removeLayover} removeTrip={removeTrip} />
        ))}
        <div>
          <button type="button" onClick={addTrip} className="rounded-lg px-4 py-2 bg-violet-600 text-white hover:bg-violet-700">+ Add another trip</button>
        </div>
      </section>

      {/* Companions */}
      <section className="mt-10 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Timeline (Vertical)</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Print‑optimised snapshot</span>
        </div>
        <TimelineVertical stops={timelineStops} layovers={timelineLayovers} />
      </section>

      {/* Text summary below timeline */}
      <section className="mt-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Text summary</h2>
        <textarea readOnly className="w-full min-h-[220px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={summaryText} />
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => navigator.clipboard.writeText(summaryText)} className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400">Copy summary</button>
        </div>
      </section>

      {/* About modal (basic) */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAbout(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">About this tool</h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">This generator creates a travel history summary (text + timeline). No clinical risk assessment is performed. Data is stored only in your browser for this session. Do not enter private or patient‑identifiable information.</p>
            <div className="mt-4 text-right">
              <button type="button" onClick={() => setShowAbout(false)} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          header, .no-print { display: none !important; }
          main { padding: 0 !important; }
          /* Ensure borders are dark and layout wraps nicely */
          .print\:block { display: block !important; }
          .print\:grid { display: grid !important; }
        }
      `}</style>
    </main>
  );
}

// ---- Trip Card ----
function TripCard({ trip, index, updateTrip, updateStop, addStop, removeStop, addLayover, updateLayover, removeLayover, removeTrip }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Trip {index + 1}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => addStop(trip.id)} className="rounded-lg px-4 py-2 bg-violet-600 text-white hover:bg-violet-700">+ Add stop</button>
          <button type="button" onClick={() => addLayover(trip.id)} className="rounded-lg px-4 py-2 bg-violet-600 text-white hover:bg-violet-700">+ Add layover</button>
          <button type="button" onClick={() => removeTrip(trip.id)} className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400">Remove trip</button>
        </div>
      </div>

      {/* Trip meta */}
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Trip start date</label>
          <input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={trip.startDate} onChange={(e) => updateTrip(trip.id, { startDate: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Trip end date</label>
          <input type="date" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={trip.endDate} onChange={(e) => updateTrip(trip.id, { endDate: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Purpose (optional)</label>
          <input type="text" placeholder="Work, VFR, tourism, humanitarian, etc." className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={trip.purpose} onChange={(e) => updateTrip(trip.id, { purpose: e.target.value })} />
        </div>
      </div>

      {/* Stops */}
      <div className="mt-6 space-y-6">
        {trip.stops.map((stop, sIdx) => (
          <StopCard key={stop.id} stop={stop} index={sIdx} onChange={(patch) => updateStop(trip.id, stop.id, patch)} onRemove={() => removeStop(trip.id, stop.id)} />
        ))}
      </div>

      {/* Layovers */}
      {trip.layovers.length > 0 && (
        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Layovers</h3>
          <div className="space-y-4">
            {trip.layovers.map((l) => (
              <LayoverCard key={l.id} layover={l} onChange={(patch) => updateLayover(trip.id, l.id, patch)} onRemove={() => removeLayover(trip.id, l.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StopCard({ stop, index, onChange, onRemove }) {
  const exp = stop.exposures;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Stop {index + 1}</h3>
        <button type="button" onClick={onRemove} className="rounded-lg px-4 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400">Remove stop</button>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Country *</label>
          {/* Free-text with datalist (will swap to canonical selector later) */}
          <input list="country-options" type="text" placeholder="Start typing…" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={stop.country} onChange={(e) => onChange({ country: e.target.value })} />
          <datalist id="country-options">
            {COUNTRY_STUB.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">City (optional)</label>
          <input type="text" placeholder="City / locality" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={stop.city} onChange={(e) => onChange({ city: e.target.value })} />
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

      {/* Accommodation */}
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Accommodation</label>
          <select className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={stop.accommodation} onChange={(e) => onChange({ accommodation: e.target.value })}>
            <option value="">Select…</option>
            {ACCOMMODATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {stop.accommodation === 'Other' && (
          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Other (describe)</label>
            <input type="text" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={stop.accommodationOther} onChange={(e) => onChange({ accommodationOther: e.target.value })} />
          </div>
        )}
      </div>

      {/* Exposures */}
      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Activities / Exposures (optional)</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Vector-borne</legend>
            <Checkbox label="Mosquito exposure" checked={exp.mosquito} onChange={(v) => onChange({ exposures: { ...exp, mosquito: v } })} />
            <Checkbox label="Tick exposure" checked={exp.tick} onChange={(v) => onChange({ exposures: { ...exp, tick: v } })} />
            <div className="flex items-start gap-2 py-1">
              <label className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">Other:</label>
              <input type="text" placeholder="e.g., sandflies" className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm" value={exp.vectorOther} onChange={(e) => onChange({ exposures: { ...exp, vectorOther: e.target.value } })} />
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Water / Environment</legend>
            <Checkbox label="Freshwater contact" checked={exp.freshwater} onChange={(v) => onChange({ exposures: { ...exp, freshwater: v } })} />
            <Checkbox label="Caves/mines" checked={exp.cavesMines} onChange={(v) => onChange({ exposures: { ...exp, cavesMines: v } })} />
            <Checkbox label="Rural/forest stay" checked={exp.ruralForest} onChange={(v) => onChange({ exposures: { ...exp, ruralForest: v } })} />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Animal & Procedures</legend>
            <Checkbox label="Animal contact" checked={exp.animalContact} onChange={(v) => onChange({ exposures: { ...exp, animalContact: v } })} />
            <Checkbox label="Animal bite/scratch" checked={exp.animalBiteScratch} onChange={(v) => onChange({ exposures: { ...exp, animalBiteScratch: v } })} />
            <Checkbox label="Bushmeat handling" checked={exp.bushmeat} onChange={(v) => onChange({ exposures: { ...exp, bushmeat: v } })} />
            <Checkbox label="Needles/tattoos/piercings" checked={exp.needlesTattoos} onChange={(v) => onChange({ exposures: { ...exp, needlesTattoos: v } })} />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Food & Water</legend>
            <Checkbox label="Street food" checked={exp.streetFood} onChange={(v) => onChange({ exposures: { ...exp, streetFood: v } })} />
            <Checkbox label="Drank untreated water" checked={exp.untreatedWater} onChange={(v) => onChange({ exposures: { ...exp, untreatedWater: v } })} />
            <Checkbox label="Undercooked food" checked={exp.undercookedFood} onChange={(v) => onChange({ exposures: { ...exp, undercookedFood: v } })} />
            <Checkbox label="Undercooked seafood" checked={exp.undercookedSeafood} onChange={(v) => onChange({ exposures: { ...exp, undercookedSeafood: v } })} />
          </fieldset>
          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Institutional / Social</legend>
            <div className="grid sm:grid-cols-2 gap-2">
              <Checkbox label="Healthcare facility contact" checked={exp.healthcareFacility} onChange={(v) => onChange({ exposures: { ...exp, healthcareFacility: v } })} />
              <Checkbox label="Prison contact" checked={exp.prison} onChange={(v) => onChange({ exposures: { ...exp, prison: v } })} />
              <Checkbox label="Refugee camp contact" checked={exp.refugeeCamp} onChange={(v) => onChange({ exposures: { ...exp, refugeeCamp: v } })} />
            </div>
            <div className="mt-2">
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Other (free‑text)</label>
              <input type="text" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm" value={exp.otherText} onChange={(e) => onChange({ exposures: { ...exp, otherText: e.target.value } })} />
            </div>
          </fieldset>
        </div>
      </div>

      {/* Vaccines / Prophylaxis */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Pre‑travel vaccinations (optional)</label>
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

function LayoverCard({ layover, onChange, onRemove }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Layover</h4>
        <button type="button" onClick={onRemove} className="rounded-lg px-4 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400">Remove layover</button>
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

function Checkbox({ label, checked, onChange }) {
  const id = useMemo(() => uid(), []);
  return (
    <label htmlFor={id} className="flex items-start gap-2 py-1 text-sm text-slate-700 dark:text-slate-300">
      <input id={id} type="checkbox" className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

// ---- Timeline (Card Rail) ----
function TimelineCardRail({ stops, layovers }) {
  // Build items with UK anchors
  const items = [
    { type: 'anchor', id: 'uk-start', label: 'United Kingdom' },
    ...stops.map((s) => ({ type: 'stop', ...s })),
    { type: 'anchor', id: 'uk-end', label: 'United Kingdom' },
  ];

  // For quick association: layovers whose start falls between the previous and current item
  const getLayoversBetween = (a, b) => {
    const aEnd = parseDate(a?.departure || a?.arrival);
    const bStart = parseDate(b?.arrival || b?.departure);
    if (!aEnd || !bStart) return [];
    return layovers.filter((l) => {
      const ls = parseDate(l.start);
      return !!ls && ls >= aEnd && ls <= bStart;
    });
  };

  return (
    <div className="no-print overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="relative">
          {/* Rail */}
          <div className="absolute left-0 right-0 top-24 h-1 bg-slate-200 dark:bg-slate-800" />
          <ul className="relative z-10 flex items-stretch gap-6 pr-4">
            {items.map((it, idx) => {
              const prev = items[idx - 1];
              const between = idx > 0 ? getLayoversBetween(prev, it) : [];
              return (
                <li key={it.id || it.label + idx} className="flex flex-col items-center">
                  {/* Layovers before this card */}
                  {between.length > 0 && (
                    <div className="mb-2 flex items-center gap-2">
                      {between.slice(0, 4).map((l) => (
                        <span key={l.id} title={(l.city ? `${l.city}, ` : '') + (l.country || '')} className="inline-block h-3 w-3 rotate-45 bg-violet-600" />
                      ))}
                      {between.length > 4 && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">+{between.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Card */}
                  {it.type === 'anchor' ? (
                    <div className="w-56 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-center">
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Anchor</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{it.label}</div>
                    </div>
                  ) : (
                    <div className="w-56 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={it.label}>{it.label}</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{toISO(it.arrival)} → {toISO(it.departure)}</div>
                      <CardBadges exposures={it.exposures} accommodation={it.accommodation} vaccines={it.vaccines} malaria={it.malaria} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {/* Print variant: grid that wraps */}
      <div className="hidden print:block">
        <div className="grid grid-cols-2 gap-4">
          {items.map((it, idx) => (
            <div key={it.id || it.label + 'p' + idx} className="rounded-xl border-2 border-slate-900 p-3">
              <div className="text-xs font-medium">{it.type === 'anchor' ? 'Anchor' : 'Stop'}</div>
              <div className="text-sm font-semibold">{it.label}</div>
              {it.type === 'stop' && (
                <>
                  <div className="text-xs">{toISO(it.arrival)} → {toISO(it.departure)}</div>
                  <CardBadges exposures={it.exposures} accommodation={it.accommodation} vaccines={it.vaccines} malaria={it.malaria} limit={6} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardBadges({ exposures, accommodation, vaccines, malaria, limit = 4 }) {
  const parts = [];
  if (accommodation) parts.push(accommodation);
  if (exposures) {
    const map = [
      ['mosquito', 'Mosquito'], ['tick', 'Tick'], ['freshwater', 'Freshwater'], ['cavesMines', 'Caves/mines'],
      ['ruralForest', 'Rural/forest'], ['animalContact', 'Animal contact'], ['animalBiteScratch', 'Bite/scratch'],
      ['bushmeat', 'Bushmeat'], ['needlesTattoos', 'Needles/tattoos'], ['streetFood', 'Street food'],
      ['untreatedWater', 'Untreated water'], ['undercookedFood', 'Undercooked food'], ['undercookedSeafood', 'Undercooked seafood'],
      ['healthcareFacility', 'Healthcare facility'], ['prison', 'Prison'], ['refugeeCamp', 'Refugee camp'],
    ];
    map.forEach(([k, label]) => { if (exposures[k]) parts.push(label); });
    if (exposures.vectorOther) parts.push(exposures.vectorOther);
    if (exposures.otherText) parts.push(exposures.otherText);
  }
  if (vaccines?.length) parts.push(`Vaccines: ${vaccines.slice(0, 2).join(', ')}`);
  if (malaria?.took && malaria?.drug) parts.push(`Malaria: ${malaria.drug}${malaria.adherence ? ` (${malaria.adherence})` : ''}`);

  if (parts.length === 0) return null;
  const shown = parts.slice(0, limit);
  const more = parts.length - shown.length;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {shown.map((p, i) => (
        <span key={i} className="inline-flex items-center rounded-full border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-300">{p}</span>
      ))}
      {more > 0 && <span className="text-[11px] text-slate-500 dark:text-slate-400">+{more} more</span>}
    </div>
  );
}

// ---- Summary builder ----
function buildSummary(state) {
  const lines = [];
  lines.push('Travel History Summary');

  state.trips.forEach((trip, idx) => {
    const header = [];
    if (trip.startDate || trip.endDate) {
      const a = trip.startDate ? toISO(trip.startDate) : '—';
      const b = trip.endDate ? toISO(trip.endDate) : '—';
      header.push(`Trip ${idx + 1} (${a} to ${b})`);
    } else {
      header.push(`Trip ${idx + 1}`);
    }
    if (trip.purpose) header.push(`purpose: ${trip.purpose}`);
    lines.push(header.join(' · '));

    trip.stops.forEach((s, sIdx) => {
      const dates = [s.arrival ? toISO(s.arrival) : '—', s.departure ? toISO(s.departure) : '—'].join(' to ');
      const place = s.city ? `${s.city}, ${s.country}` : s.country || '—';
      const extras = [];
      if (s.accommodation) extras.push(`accommodation: ${s.accommodation}${s.accommodation === 'Other' && s.accommodationOther ? ` (${s.accommodationOther})` : ''}`);
      if (s.vaccines?.length) extras.push(`vaccinations: ${s.vaccines.join(', ')}`);
      if (s.malaria?.took) extras.push(`malaria prophylaxis: ${s.malaria.drug}${s.malaria.adherence ? ` (adherence: ${s.malaria.adherence})` : ''}`);
      const expTxt = exposuresToText(s.exposures);
      if (expTxt) extras.push(`exposures: ${expTxt}`);
      lines.push(`  • Stop ${sIdx + 1}: ${place} — ${dates}${extras.length ? `; ${extras.join('; ')}` : ''}`);
    });

    if (trip.layovers.length) {
      lines.push('  • Layovers:');
      trip.layovers.forEach((l) => {
        const dates = [l.start ? toISO(l.start) : '—', l.end ? toISO(l.end) : '—'].join(' to ');
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

  lines.push('Note: Timeline displays UK → trips → UK for visual clarity.');

  return lines.join('\n');
}

function exposuresToText(exp) {
  if (!exp) return '';
  return exposuresToArray(exp).join(', ');
}

function exposuresToArray(exp) {
  if (!exp) return [];
  const labels = [];
  if (exp.mosquito) labels.push('mosquito exposure');
  if (exp.tick) labels.push('tick exposure');
  if (exp.vectorOther) labels.push(exp.vectorOther);
  if (exp.freshwater) labels.push('freshwater contact');
  if (exp.cavesMines) labels.push('caves/mines');
  if (exp.ruralForest) labels.push('rural/forest stay');
  if (exp.animalContact) labels.push('animal contact');
  if (exp.animalBiteScratch) labels.push('animal bite/scratch');
  if (exp.bushmeat) labels.push('bushmeat');
  if (exp.needlesTattoos) labels.push('needles/tattoos/piercings');
  if (exp.streetFood) labels.push('street food');
  if (exp.untreatedWater) labels.push('untreated water');
  if (exp.undercookedFood) labels.push('undercooked food');
  if (exp.undercookedSeafood) labels.push('undercooked seafood');
  if (exp.healthcareFacility) labels.push('healthcare facility contact');
  if (exp.prison) labels.push('prison contact');
  if (exp.refugeeCamp) labels.push('refugee camp contact');
  if (exp.otherText) labels.push(exp.otherText);
  return labels;
}
