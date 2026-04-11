'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { CSC_COUNTRIES, TRIP_TEMPLATES } from './_lib/constants';
import { parseDate, buildTripEvents, emptyTrip, emptyStop, emptyLayover, emptyPastTravel, initialState } from './_lib/utils';
import { buildSummaryFromEvents } from './_lib/summary-engine';
import { Printer, AlertTriangle, Trash, ArrowLeft, Plane, Plus, RefreshCw, Clipboard, Check } from 'lucide-react';
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
  const [templateOpen, setTemplateOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const updateTrip = (tripId, patch) => setState((p) => ({
    ...p,
    trips: p.trips.map((t) => {
      if (t.id !== tripId) return t;
      const updated = { ...t, ...patch };
      // Auto-push departure date to first stop's arrival if the first stop has no arrival or its arrival matched the old departure
      if (patch.departureDate && updated.stops.length > 0) {
        const firstStop = updated.stops[0];
        if (!firstStop.arrival || firstStop.arrival === t.departureDate) {
          updated.stops = updated.stops.map((s, i) => i === 0 ? { ...s, arrival: patch.departureDate } : s);
        }
      }
      return updated;
    }),
  }));
  const updateStop = (tripId, stopId, patch) => setState((p) => ({ ...p, trips: p.trips.map((t) => (t.id === tripId ? { ...t, stops: t.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)) } : t)) }));
  const addTrip = () => setTemplateOpen(true);
  const addTripFromTemplate = (overrides = {}) => {
    const tr = emptyTrip(overrides);
    setState((p) => ({ ...p, trips: [...p.trips, tr] }));
    setPendingScrollId(tr.id);
    setTemplateOpen(false);
  };
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
  const handleCopy = () => {
    navigator.clipboard.writeText(summaryTextPlain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const LABEL_BASE = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";
  const INPUT_BASE = "w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-brand/10">
                <Plane className="w-4 h-4 text-brand" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Travel History Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-600 hover:border-slate-400 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() => setPrintOpen(true)}
              className="px-4 py-2 rounded-lg bg-brand hover:opacity-90 text-white text-xs font-semibold shadow-sm transition-opacity flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Generate Report
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="pt-8 pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* PRIVACY NOTICE */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Data Privacy Notice</p>
              <p className="text-sm text-amber-800">
                Do not enter patient-identifiable data (PID). This tool processes data locally in your browser.
              </p>
            </div>
          </div>

          {/* VALIDATION ERRORS */}
          {issues.length > 0 && (
            <div className="space-y-2">
              {issues.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {e.msg}
                </div>
              ))}
            </div>
          )}

          {/* TRIP BUILDER */}
          <section className="space-y-6">
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

            {templateOpen ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-800 mb-3">Choose a template</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TRIP_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.key}
                      type="button"
                      onClick={() => addTripFromTemplate(tpl.overrides)}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-white text-left transition-colors"
                    >
                      <span className="block text-sm font-semibold text-slate-800">{tpl.label}</span>
                      <span className="block text-xs text-slate-400 mt-0.5">{tpl.description}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setTemplateOpen(false)}
                  className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={addTrip}
                className="w-full py-5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:text-brand hover:border-brand/40 hover:bg-white transition-all flex items-center justify-center gap-2.5 group"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-semibold">Add Trip</span>
              </button>
            )}
          </section>

          {/* PAST TRAVEL */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Significant Past Travel History
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {state.pastTravels.length === 0 && (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-400">No historical data recorded.</p>
                </div>
              )}

              {state.pastTravels.map((pt) => (
                <div key={pt.id} ref={setItemRef(pt.id)} className="grid gap-4 sm:grid-cols-12 items-start p-4 rounded-lg border border-slate-200 bg-slate-50 hover:border-slate-300 transition-colors">
                  <div className="sm:col-span-4">
                    <label className={LABEL_BASE}>Country</label>
                    <SearchableSelect
                      value={pt.country}
                      onChange={(val) => updatePastTravel(pt.id, { country: val })}
                      options={CSC_COUNTRIES.map(c => c.name)}
                      placeholder="Select country"
                    />
                  </div>
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
                  <div className="sm:col-span-5">
                    <label className={LABEL_BASE}>Clinical Notes</label>
                    <textarea
                      rows={1}
                      placeholder="Details..."
                      className={clsx(INPUT_BASE, "min-h-[42px] resize-none")}
                      value={pt.details}
                      onChange={(e) => updatePastTravel(pt.id, { details: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end pt-6">
                    <button type="button" onClick={() => removePastTravel(pt.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPastTravel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-slate-400 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Entry
              </button>
            </div>
          </section>

        </div>
      </main>

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
