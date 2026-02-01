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

  return (
    <div className="min-h-screen bg-black text-neutral-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* --- PAGE HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-neutral-500 hover:text-emerald-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-6 w-px bg-neutral-800" />
            <div className="flex items-center gap-3">
              <Plane className="w-5 h-5 text-emerald-500" />
              <span className="font-mono text-xs tracking-widest text-neutral-400 uppercase hidden sm:inline-block">
                Travel_History_Generator
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={clearAll}
              className="px-3 py-1.5 rounded-md text-xs font-mono text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">RESET</span>
            </button>
            <button 
              onClick={() => setPrintOpen(true)}
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              GENERATE_REPORT
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* PRIVACY WARNING (Fixed: Single line, no title) */}
          <div className="rounded border border-amber-900/50 bg-amber-950/10 p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm font-mono text-amber-500/90">
              Do not enter patient-identifiable data (PID). This tool processes data locally.
            </p>
          </div>

          {/* ERROR DISPLAY */}
          {issues.length > 0 && (
            <div className="space-y-2">
              {issues.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded border border-red-900/50 bg-red-950/20 text-red-400 text-sm font-mono">
                  <Terminal className="w-4 h-4" />
                  {e.msg}
                </div>
              ))}
            </div>
          )}

          {/* TRIP BUILDER SECTION */}
          <section className="space-y-8">
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
              className="w-full py-4 rounded-xl border border-dashed border-neutral-800 text-neutral-500 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-950/10 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {/* Changed Text: Initialize New Trip -> Add New Trip */}
              <span className="font-mono text-sm tracking-wider uppercase">Add New Trip</span>
            </button>
          </section>

          {/* SIGNIFICANT PAST TRAVEL SECTION */}
          <section className="rounded-xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-neutral-600" />
               <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">Significant Past Travel</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {state.pastTravels.length === 0 && (
                <p className="text-sm text-neutral-600 font-mono italic px-2">No historical data recorded.</p>
              )}
              
              {state.pastTravels.map((pt) => (
                <div key={pt.id} ref={setItemRef(pt.id)} className="grid gap-4 sm:grid-cols-12 items-start p-4 rounded-lg border border-neutral-800 bg-black/40 hover:border-neutral-700 transition-colors">
                  
                  {/* Country Input */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5">Country</label>
                    <SearchableSelect 
                      value={pt.country} 
                      onChange={(val) => updatePastTravel(pt.id, { country: val })} 
                      options={CSC_COUNTRIES.map(c => c.name)}
                      placeholder="Select country"
                    />
                  </div>

                  {/* Year Input */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5">Year</label>
                    <input 
                      type="text" 
                      placeholder="YYYY" 
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono"
                      value={pt.year}
                      onChange={(e) => updatePastTravel(pt.id, { year: e.target.value })} 
                    />
                  </div>

                  {/* Details Input */}
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1.5">Clinical Notes</label>
                    <textarea 
                      rows={1}
                      placeholder="Details..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 min-h-[42px] resize-none"
                      value={pt.details}
                      onChange={(e) => updatePastTravel(pt.id, { details: e.target.value })}
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="sm:col-span-1 flex justify-end pt-7">
                    <button type="button" onClick={() => removePastTravel(pt.id)} className="text-neutral-600 hover:text-red-500 transition-colors">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={addPastTravel} 
                className="mt-2 text-xs font-mono text-emerald-500 hover:text-emerald-400 flex items-center gap-2"
              >
                <Plus className="w-3 h-3" />
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
