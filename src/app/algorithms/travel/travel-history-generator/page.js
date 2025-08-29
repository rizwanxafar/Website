'use client';

// src/app/algorithms/travel/travel-history-generator/page.js
// Travel History Generator — v4
// - Vertical rail with nodes outside cards (arrival node + bold date above, departure node + bold date below)
// - UK start/end nodes show overall earliest trip start and latest trip end
// - Layovers get compact nodes + bold dates, no full card
// - Client-only; session storage; no PII; text summary + print-friendly timeline

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
const LS_KEY = 'travel-history-generator:v4';

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
  return aS < bE && bS < aE;
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

  // Exposures with per-exposure details (details shown only in text summary)
  exposures: {
    mosquito: false, mosquitoDetails: '',
    tick: false, tickDetails: '',
    vectorOther: '', vectorOtherDetails: '',
    freshwater: false, freshwaterDetails: '',
    cavesMines: false, cavesMinesDetails: '',
    ruralForest: false, ruralForestDetails: '',
    animalContact: false, animalContactDetails: '',
    animalBiteScratch: false, animalBiteScratchDetails: '',
    bushmeat: false, bushmeatDetails: '',
    needlesTattoos: false, needlesTattoosDetails: '',
    funerals: false, funeralsDetails: '',
    largeGatherings: false, largeGatheringsDetails: '',
    streetFood: false, streetFoodDetails: '',
    untreatedWater: false, untreatedWaterDetails: '',
    undercookedFood: false, undercookedFoodDetails: '',
    undercookedSeafood: false, undercookedSeafoodDetails: '',
    healthcareFacility: false, healthcareFacilityDetails: '',
    prison: false, prisonDetails: '',
    refugeeCamp: false, refugeeCampDetails: '',
    safariWildlife: false, safariWildlifeDetails: '', // extra exposure
    otherText: '',
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

  // Derived — flattened/sorted stops & layovers for timeline
  const timelineStops = useMemo(() => {
    const stops = [];
    state.trips.forEach((trip) => {
      trip.stops.forEach((s) => {
        const cityLabel = (s.cities || []).filter(Boolean).join(', ');
        const place = s.country ? (cityLabel ? `${cityLabel}, ${s.country}` : s.country) : cityLabel || '—';
        stops.push({
          id: s.id,
          label: place,
          country: s.country,
          cities: s.cities,
          arrival: s.arrival,
          departure: s.departure,
          exposures: s.exposures,
          accommodations: s.accommodations,
          vaccines: s.vaccines,
          malaria: s.malaria,
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

  // UK dates: earliest trip start, latest trip end
  const ukDates = useMemo(() => {
    const starts = state.trips.map((t) => parseDate(t.startDate)).filter(Boolean);
    const ends = state.trips.map((t) => parseDate(t.endDate)).filter(Boolean);
    const minStart = starts.length ? new Date(Math.min(...starts)) : null;
    const maxEnd = ends.length ? new Date(Math.max(...ends)) : null;
    return {
      depart: minStart ? formatDMY(minStart.toISOString()) : '',
      return: maxEnd ? formatDMY(maxEnd.toISOString()) : '',
    };
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
        <p className="text-sm"><strong>Privacy:</strong> No data is stored on our servers. This tool uses your browser storage only. Do <strong>not</strong> enter private or patient-identifiable information.</p>
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

      {/* Timeline (Vertical with outside nodes) */}
      <section className="mt-10 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Timeline</h2>
        </div>
        <TimelineVertical stops={timelineStops} layovers={timelineLayovers} ukDates={ukDates} />
      </section>

      {/* Text summary */}
      <section className="mt-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Text summary</h2>
        <textarea readOnly className="w-full min-h-[240px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm" value={summaryText} />
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => navigator.clipboard.writeText(summaryText)} className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400">Copy summary</button>
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
          .print\\:block { display: block !important; }
          .print\\:grid { display: grid !important; }
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
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Stop {index + 1}</h3>
        <button type="button" onClick={onRemove} className="rounded-lg px-4 py-1.5 text-xs border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400">Remove stop</button>
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
                <button type="button" onClick={() => removeCity(i)} className="rounded-lg px-3 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addCity} className="rounded-lg px-3 py-1.5 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400 text-xs">+ Add another city</button>
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
            <ExposureCheck label="Mosquito exposure" checked={exp.mosquito} details={exp.mosquitoDetails} onToggle={(v) => onChange({ exposures: { ...exp, mosquito: v } })} onDetails={(v) => onChange({ exposures: { ...exp, mosquitoDetails: v } })} />
            <ExposureCheck label="Tick exposure" checked={exp.tick} details={exp.tickDetails} onToggle={(v) => onChange({ exposures: { ...exp, tick: v } })} onDetails={(v) => onChange({ exposures: { ...exp, tickDetails: v } })} />

            <div className="space-y-1">
              <div className="flex items-start gap-2 py-1">
                <input id={`vectorOther-${stop.id}`} type="checkbox" className="h-4 w-4 mt-0.5 rounded border-slate-300 dark:border-slate-700" checked={!!exp.vectorOther} onChange={(e) => onChange({ exposures: { ...exp, vectorOther: e.target.checked ? exp.vectorOther || 'Other vector' : '' } })} />
                <label htmlFor={`vectorOther-${stop.id}`} className="text-sm text-slate-700 dark:text-slate-300">Other vector</label>
              </div>
              {exp.vectorOther !== '' && (
                <>
                  <input type="text" placeholder="e.g., sandflies" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm" value={exp.vectorOther} onChange={(e) => onChange({ exposures: { ...exp, vectorOther: e.target.value } })} />
                  <input type="text" placeholder="Details (optional)" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm" value={exp.vectorOtherDetails} onChange={(e) => onChange({ exposures: { ...exp, vectorOtherDetails: e.target.value } })} />
                </>
              )}
            </div>
          </fieldset>

          {/* Water / Environment */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Water / Environment</legend>
            <ExposureCheck label="Freshwater contact" checked={exp.freshwater} details={exp.freshwaterDetails} onToggle={(v) => onChange({ exposures: { ...exp, freshwater: v } })} onDetails={(v) => onChange({ exposures: { ...exp, freshwaterDetails: v } })} />
            <ExposureCheck label="Caves/mines" checked={exp.cavesMines} details={exp.cavesMinesDetails} onToggle={(v) => onChange({ exposures: { ...exp, cavesMines: v } })} onDetails={(v) => onChange({ exposures: { ...exp, cavesMinesDetails: v } })} />
            <ExposureCheck label="Rural/forest stay" checked={exp.ruralForest} details={exp.ruralForestDetails} onToggle={(v) => onChange({ exposures: { ...exp, ruralForest: v } })} onDetails={(v) => onChange({ exposures: { ...exp, ruralForestDetails: v } })} />
          </fieldset>

          {/* Animal & Procedures */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Animal & Procedures</legend>
            <ExposureCheck label="Animal contact" checked={exp.animalContact} details={exp.animalContactDetails} onToggle={(v) => onChange({ exposures: { ...exp, animalContact: v } })} onDetails={(v) => onChange({ exposures: { ...exp, animalContactDetails: v } })} />
            <ExposureCheck label="Animal bite/scratch" checked={exp.animalBiteScratch} details={exp.animalBiteScratchDetails} onToggle={(v) => onChange({ exposures: { ...exp, animalBiteScratch: v } })} onDetails={(v) => onChange({ exposures: { ...exp, animalBiteScratchDetails: v } })} />
            <ExposureCheck label="Bushmeat handling" checked={exp.bushmeat} details={exp.bushmeatDetails} onToggle={(v) => onChange({ exposures: { ...exp, bushmeat: v } })} onDetails={(v) => onChange({ exposures: { ...exp, bushmeatDetails: v } })} />
            <ExposureCheck label="Needles/tattoos/piercings" checked={exp.needlesTattoos} details={exp.needlesTattoosDetails} onToggle={(v) => onChange({ exposures: { ...exp, needlesTattoos: v } })} onDetails={(v) => onChange({ exposures: { ...exp, needlesTattoosDetails: v } })} />
            <ExposureCheck label="Safari / wildlife viewing" checked={exp.safariWildlife} details={exp.safariWildlifeDetails} onToggle={(v) => onChange({ exposures: { ...exp, safariWildlife: v } })} onDetails={(v) => onChange({ exposures: { ...exp, safariWildlifeDetails: v } })} />
          </fieldset>

          {/* Food & Water */}
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Food & Water</legend>
            <ExposureCheck label="Street food" checked={exp.streetFood} details={exp.streetFoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, streetFood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, streetFoodDetails: v } })} />
            <ExposureCheck label="Drank untreated water" checked={exp.untreatedWater} details={exp.untreatedWaterDetails} onToggle={(v) => onChange({ exposures: { ...exp, untreatedWater: v } })} onDetails={(v) => onChange({ exposures: { ...exp, untreatedWaterDetails: v } })} />
            <ExposureCheck label="Undercooked food" checked={exp.undercookedFood} details={exp.undercookedFoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, undercookedFood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, undercookedFoodDetails: v } })} />
            <ExposureCheck label="Undercooked seafood" checked={exp.undercookedSeafood} details={exp.undercookedSeafoodDetails} onToggle={(v) => onChange({ exposures: { ...exp, undercookedSeafood: v } })} onDetails={(v) => onChange({ exposures: { ...exp, undercookedSeafoodDetails: v } })} />
          </fieldset>

          {/* Institutional / Social */}
          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Institutional / Social</legend>
            <div className="grid sm:grid-cols-2 gap-2">
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
 * Timeline (Vertical)
 * - Fixed left gutter with spine
 * - For each stop: Top "arrival row" (node + bold date), then card, then Bottom "departure row" (node + bold date)
 * - UK anchors use ukDates.depart and ukDates.return
 * - Layovers are compact strips with their own nodes + bold dates between relevant stops
 */
function TimelineVertical({ stops, layovers, ukDates }) {
  // Build simple sequence with UK anchors
  const items = [
    { type: 'anchor-start', id: 'uk-start', label: 'United Kingdom', date: ukDates?.depart || '' },
    ...stops.map((s) => ({ type: 'stop', ...s })),
    { type: 'anchor-end', id: 'uk-end', label: 'United Kingdom', date: ukDates?.return || '' },
  ];

  // Helper: layovers whose start falls between stop A and next stop B
  const layoversBetween = (a, b) => {
    const aEnd = parseDate(a?.departure || a?.arrival);
    const bStart = parseDate(b?.arrival || b?.departure);
    if (!aEnd || !bStart) return [];
    return layovers.filter((l) => {
      const ls = parseDate(l.start);
      return !!ls && ls >= aEnd && ls <= bStart;
    });
  };

  // Shared gutter UI
  const Spine = () => (
    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
  );
  const Node = () => (
    <span className="inline-block h-3 w-3 rounded-full bg-violet-600 align-middle" aria-hidden="true" />
  );

  return (
    <div className="relative">
      <Spine />
      <ol className="space-y-6">
        {/* UK start anchor */}
        <li className="relative pl-24">
          <div className="flex items-center gap-3">
            <div className="absolute left-8 -translate-x-1/2">
              <Node />
            </div>
            {items[0].date ? <strong className="tabular-nums">{items[0].date}</strong> : <span className="text-slate-500 text-sm">Start</span>}
          </div>
          <div className="mt-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">United Kingdom</div>
          </div>
        </li>

        {/* Iterate stops with arrival row, card, layovers, departure row */}
        {items
          .filter((it) => it.type === 'stop')
          .map((it, idx, arr) => {
            const nextStop = arr[idx + 1];
            const between = nextStop ? layoversBetween(it, nextStop) : [];
            return (
              <li key={it.id} className="relative pl-24">
                {/* Arrival row (node + bold date) */}
                <div className="flex items-center gap-3">
                  <div className="absolute left-8 -translate-x-1/2">
                    <Node />
                  </div>
                  <strong className="tabular-nums">{formatDMY(it.arrival)}</strong>
                </div>

                {/* Stop card */}
                <div className="mt-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
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

                {/* Layovers between this stop and the next stop */}
                {between.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {between.map((l) => (
                      <div key={l.id} className="relative">
                        {/* Layover arrival row */}
                        <div className="flex items-center gap-3 pl-24">
                          <div className="absolute left-8 -translate-x-1/2">
                            <Node />
                          </div>
                          <strong className="tabular-nums">{formatDMY(l.start)}</strong>
                          <span className="text-xs text-slate-500">Layover start</span>
                        </div>
                        {/* Layover strip */}
                        <div className="mt-1 ml-24 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                          {(l.city ? `${l.city}, ` : '') + (l.country || '')}
                          {l.leftAirport === 'yes' && l.accommodation ? ` · ${l.accommodation}` : ''}
                        </div>
                        {/* Layover departure row */}
                        <div className="mt-1 flex items-center gap-3 pl-24">
                          <div className="absolute left-8 -translate-x-1/2">
                            <Node />
                          </div>
                          <strong className="tabular-nums">{formatDMY(l.end)}</strong>
                          <span className="text-xs text-slate-500">Layover end</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Departure row (node + bold date) */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="absolute left-8 -translate-x-1/2">
                    <Node />
                  </div>
                  <strong className="tabular-nums">{formatDMY(it.departure)}</strong>
                </div>
              </li>
            );
          })}

        {/* UK end anchor */}
        <li className="relative pl-24">
          <div className="mt-1 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">United Kingdom</div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="absolute left-8 -translate-x-1/2">
              <Node />
            </div>
            {items[items.length - 1].date ? <strong className="tabular-nums">{items[items.length - 1].date}</strong> : <span className="text-slate-500 text-sm">End</span>}
          </div>
        </li>
      </ol>
    </div>
  );
}

// ---- Summary builder ----
// Text summary uses indented bullets for exposures (with optional details)
function buildSummary(state) {
  const lines = [];
  lines.push('Travel History Summary');

  state.trips.forEach((trip, idx) => {
    const header = [];
    if (trip.startDate || trip.endDate) {
      const a = trip.startDate ? formatDMY(trip.startDate) : '—';
      const b = trip.endDate ? formatDMY(trip.endDate) : '—';
      header.push(`Trip ${idx + 1} (${a} to ${b})`);
    } else {
      header.push(`Trip ${idx + 1}`);
    }
    if (trip.purpose) header.push(`purpose: ${trip.purpose}`);
    lines.push(header.join(' · '));

    trip.stops.forEach((s, sIdx) => {
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

      // Exposures as indented bullets with optional details
      const bullets = exposureBullets(s.exposures);
      if (bullets.length) {
        bullets.forEach(({ label, details }) => {
          lines.push(`      - ${label}${details ? ` — ${details}` : ''}`);
        });
      }
    });

    if (trip.layovers.length) {
      lines.push('  • Layovers:');
      trip.layovers.forEach((l) => {
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

  lines.push('Note: Dates appear on the rail; cards show travel details.');

  return lines.join('\n');
}

// Exposure labels for the visual timeline (no details)
function exposureLabels(exp) {
  const labels = [];
  if (!exp) return labels;

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
  if (exp.safariWildlife) labels.push('safari / wildlife viewing');
  return labels;
}

// Exposure bullets for the text summary (with details)
function exposureBullets(exp) {
  if (!exp) return [];
  const out = [];
  const push = (label, flag, details) => { if (flag) out.push({ label, details: details?.trim() || '' }); };

  push('mosquito exposure', exp.mosquito, exp.mosquitoDetails);
  push('tick exposure', exp.tick, exp.tickDetails);
  if (exp.vectorOther) out.push({ label: exp.vectorOther, details: exp.vectorOtherDetails?.trim() || '' });

  push('freshwater contact', exp.freshwater, exp.freshwaterDetails);
  push('caves/mines', exp.cavesMines, exp.cavesMinesDetails);
  push('rural/forest stay', exp.ruralForest, exp.ruralForestDetails);

  push('animal contact', exp.animalContact, exp.animalContactDetails);
  push('animal bite/scratch', exp.animalBiteScratch, exp.animalBiteScratchDetails);
  push('bushmeat', exp.bushmeat, exp.bushmeatDetails);
  push('needles/tattoos/piercings', exp.needlesTattoos, exp.needlesTattoosDetails);

  push('street food', exp.streetFood, exp.streetFoodDetails);
  push('untreated water', exp.untreatedWater, exp.untreatedWaterDetails);
  push('undercooked food', exp.undercookedFood, exp.undercookedFoodDetails);
  push('undercooked seafood', exp.undercookedSeafood, exp.undercookedSeafoodDetails);

  push('healthcare facility contact', exp.healthcareFacility, exp.healthcareFacilityDetails);
  push('prison contact', exp.prison, exp.prisonDetails);
  push('refugee camp contact', exp.refugeeCamp, exp.refugeeCampDetails);

  push('safari / wildlife viewing', exp.safariWildlife, exp.safariWildlifeDetails);

  if (exp.otherText?.trim()) out.push({ label: exp.otherText.trim(), details: '' });

  return out;
}
