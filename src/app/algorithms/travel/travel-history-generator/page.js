'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { CSC_COUNTRIES, BTN_PRIMARY, BTN_SECONDARY, LINKISH_SECONDARY, TEXT_INPUT_CLASS, INPUT_BASE, TEXTAREA_CLASS, SECTION_HEADING } from './_lib/constants';
import { uid, classNames, parseDate, buildTripEvents, emptyTrip, emptyStop, emptyLayover, emptyPastTravel, initialState } from './_lib/utils';
import { buildSummaryFromEvents } from './_lib/summary-engine';
import { Printer, Alert, Trash } from './_components/icons';
import SearchableSelect from './_components/ui/SearchableSelect';
import TripCard from './_components/TravelForm/TripCard';
import PrintOverlay from './_components/Print/PrintOverlay';

export default function TravelHistoryGeneratorPage() {
  const [state, setState] = useState(initialState);
  const [issues, setIssues] = useState([]);
  const [highlight, setHighlight] = useState({ stopIds: new Set(), layoverIds: new Set() });
  const [pendingScrollId, setPendingScrollId] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  
  const itemRefs = useRef(new Map());
  const setItemRef = (id) => (el) => { if (el) itemRefs.current.set(id, el); };

  useEffect(() => {
    const hasData = state.trips.some(t => t.stops.length > 0 || t.layovers.length > 0) || state.pastTravels.length > 0;
    const onBeforeUnload = (e) => { if (!hasData) return; e.preventDefault(); e.returnValue = ""; };
    if (hasData) window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.trips, state.pastTravels]);

  useEffect(() => {
    const list = [];
    const stopIds = new Set();
    const layIds = new Set();
    state.trips.forEach((trip, tIdx) => {
      trip.stops.forEach((s, sIdx) => {
        if (s.arrival && s.departure) {
          const a = parseDate(s.arrival), d = parseDate(s.departure);
          if (a && d && a > d) {
            list.push({ level: 'error', msg: `Trip ${tIdx + 1}, Destination ${sIdx + 1}: Arrival is after departure.` });
            stopIds.add(s.id);
          }
        }
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

  // --- State Actions ---
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
            <Printer className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
          <button type="button" onClick={clearAll} className={BTN_SECONDARY}>Clear all</button>
        </div>
      </header>

      <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-4 text-amber-900 dark:text-amber-200 flex items-center gap-3">
        <span className="shrink-0 text-amber-600 dark:text-amber-400">
           <Alert className="w-5 h-5" />
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

      {/* Significant Past Travel */}
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
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addPastTravel} className={LINKISH_SECONDARY}>+ Add entry</button>
        </div>
      </section>

      {/* FOOTER ACTION AREA */}
      <section className="mt-8 flex justify-end">
         <button type="button" onClick={() => setPrintOpen(true)} className={clsx(BTN_PRIMARY, "w-full sm:w-auto shadow-lg")}>
            <Printer className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
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
