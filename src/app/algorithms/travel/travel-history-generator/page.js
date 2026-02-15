'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
// We keep these imports for logic, but we will override styles locally
import { CSC_COUNTRIES } from './_lib/constants';
import { classNames, parseDate, buildTripEvents, emptyTrip, emptyStop, emptyLayover, emptyPastTravel, initialState } from './_lib/utils';
import { buildSummaryFromEvents } from './_lib/summary-engine';
import { Printer, AlertTriangle, Trash, ArrowLeft, Plane, Plus, RefreshCw, Terminal } from 'lucide-react';
import SearchableSelect from './_components/ui/SearchableSelect';
import TripCard from './_components/TravelForm/TripCard';
import PrintOverlay from './_components/Print/PrintOverlay';
import Link from 'next/link';

export default function TravelHistoryGeneratorPage() {
  const [state, setState] = useState(initialState);
  const [issues, setIssues] = useState([]);
  const [highlight, setHighlight] = useState({ stopIds: new Set(), layoverIds: new Set() });
  const [pendingScrollId, setPendingScrollId] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  
  const itemRefs = useRef(new Map());
  const setItemRef = (id) => (el) => { if (el) itemRefs.current.set(id, el); };

  // --- Logic Hooks (Unchanged) ---
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

  // --- Actions ---
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

  // --- CONSTANTS FOR NEW UI SCALE ---
  // We use these constants to keep the UI consistent
  const LABEL_BASE = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5";
  const INPUT_BASE = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all shadow-sm";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* --- PAGE HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 shadow-md">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/" className="text-slate-400 hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-800">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Plane className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 text-lg tracking-tight">Travel History Generator</span>
                <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">Clinical Assessment Tool</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={clearAll}
              className="px-4 py-2.5 rounded-lg text-xs font-bold font-mono text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">RESET</span>
            </button>
            <button 
              onClick={() => setPrintOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono tracking-wide shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              GENERATE_REPORT
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-28 pb-32 px-6">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* PRIVACY WARNING */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-4 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-500 uppercase tracking-wide">Data Privacy Notice</p>
              <p className="text-base text-slate-300">
                Do not enter patient-identifiable data (PID). This tool processes data locally in your browser.
              </p>
            </div>
          </div>

          {/* ERROR DISPLAY */}
          {issues.length > 0 && (
            <div className="space-y-3">
              {issues.map((e, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-sm font-mono shadow-sm">
                  <Terminal className="w-5 h-5 shrink-0" />
                  {e.msg}
                </div>
              ))}
            </div>
          )}

          {/* TRIP BUILDER SECTION */}
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
            
            <button 
              type="button" 
              onClick={addTrip} 
              className="w-full py-6 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-3 group"
            >
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                 <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-base tracking-wide uppercase">Add New Trip</span>
            </button>
          </section>

          {/* SIGNIFICANT PAST TRAVEL SECTION */}
          <section className="rounded-2xl border border-slate-700 bg-slate-800/20 overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-slate-700 bg-slate-800/40 flex items-center gap-4">
               <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
               <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">Significant Past Travel History</h2>
            </div>
            
            <div className="p-8 space-y-6">
              {state.pastTravels.length === 0 && (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-base text-slate-500 font-medium">No historical data recorded.</p>
                </div>
              )}
              
              {state.pastTravels.map((pt) => (
                <div key={pt.id} ref={setItemRef(pt.id)} className="grid gap-6 sm:grid-cols-12 items-start p-6 rounded-xl border border-slate-700 bg-slate-900/50 hover:border-slate-600 transition-all shadow-sm">
                  
                  {/* Country Input */}
                  <div className="sm:col-span-4">
                    <label className={LABEL_BASE}>Country</label>
                    <SearchableSelect 
                      value={pt.country} 
                      onChange={(val) => updatePastTravel(pt.id, { country: val })} 
                      options={CSC_COUNTRIES.map(c => c.name)}
                      placeholder="Select country"
                    />
                  </div>

                  {/* Year Input */}
                  <div className="sm:col-span-2">
                    <label className={LABEL_BASE}>Year</label>
                    <input 
                      type="text" 
                      placeholder="YYYY" 
                      className={INPUT_BASE}
                      value={pt.year}
                      onChange={(e) => updatePastTravel(pt.id, { year: e.target.value })} 
                    />
                  </div>

                  {/* Details Input */}
                  <div className="sm:col-span-5">
                    <label className={LABEL_BASE}>Clinical Notes</label>
                    <textarea 
                      rows={1}
                      placeholder="Details..."
                      className={clsx(INPUT_BASE, "min-h-[50px] resize-none")}
                      value={pt.details}
                      onChange={(e) => updatePastTravel(pt.id, { details: e.target.value })}
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="sm:col-span-1 flex justify-end pt-8">
                    <button type="button" onClick={() => removePastTravel(pt.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={addPastTravel} 
                className="mt-4 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/50 text-xs font-bold font-mono flex items-center gap-2 transition-all uppercase tracking-wide"
              >
                <Plus className="w-4 h-4" />
                ADD_ENTRY
              </button>
            </div>
          </section>

        </div>
      </main>

      {/* --- PRINT OVERLAY --- */}
      <PrintOverlay 
        open={printOpen} 
        onClose={() => setPrintOpen(false)} 
        events={mergedEventsAllTrips} 
        summaryHtml={summaryHtml} 
        summaryText={summaryTextPlain}
      />
    </div>
  );
}
