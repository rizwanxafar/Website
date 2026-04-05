"use client";

import { useEffect, useMemo } from "react";
import DecisionCard from "@/components/DecisionCard";
import { vhfCountryNames } from "@/data/vhfCountries";
import { Trash, Plus } from "lucide-react";
import ResponsiveDatePicker from "src/app/algorithms/travel/travel-history-generator/_components/ui/ResponsiveDatePicker.js";
import { normalizeName } from "@/utils/names";
import { clsx } from "clsx";

const btnPrimary = "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand hover:opacity-90 text-white text-sm font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
const btnSecondary = "px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-slate-400 text-sm font-medium transition-colors";
const inputStyles = "w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors";

const uid = () => Math.random().toString(36).slice(2, 9);

function validateNoOverlap(rows) {
  const sorted = [...rows].sort((a, b) => {
    const ta = a.leaving ? new Date(a.leaving).getTime() : 0;
    const tb = b.leaving ? new Date(b.leaving).getTime() : 0;
    return ta - tb;
  });
  for (let i = 0; i < sorted.length - 1; i++) {
    const leave = sorted[i].leaving && new Date(sorted[i].leaving).getTime();
    const arrive = sorted[i + 1].arrival && new Date(sorted[i + 1].arrival).getTime();
    if (leave && arrive && leave > arrive) return false;
  }
  return true;
}

export default function SelectStep({
  selected, setSelected, onset, setOnset, query, setQuery, open, setOpen, showInput, setShowInput, inputRef, onBackToScreen, onReset, onContinue,
}) {
  const filtered = useMemo(() => {
    const q = normalizeName(query);
    if (!q) return [];
    const out = [];
    for (const name of vhfCountryNames) {
      if (normalizeName(name).includes(q)) { out.push(name); if (out.length >= 12) break; }
    }
    return out;
  }, [query]);

  useEffect(() => {
    if (showInput) setTimeout(() => inputRef?.current?.focus(), 0);
  }, [showInput, inputRef]);

  const addCountry = (name) => {
    if (!name) return;
    setSelected((prev) => [...prev, { id: uid(), name, arrival: "", leaving: "" }]);
    setQuery(""); setOpen(false); setShowInput(false);
  };

  const addAnother = () => {
    setShowInput(true); setQuery(""); setOpen(false);
    setTimeout(() => inputRef?.current?.focus(), 0);
  };

  const updateDates = (id, field, value) => {
    setSelected((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      if (field === "arrival") {
        const leavingOk = c.leaving && value && new Date(value) > new Date(c.leaving) ? "" : c.leaving || "";
        return { ...c, arrival: value, leaving: leavingOk };
      }
      if (field === "leaving") {
        const newLeaving = (c.arrival && value && new Date(value) < new Date(c.arrival)) ? c.arrival : value;
        return { ...c, leaving: newLeaving };
      }
      return c;
    }));
  };

  const removeRow = (id) => {
    setSelected((prev) => prev.filter((c) => c.id !== id));
    if (selected.length <= 1) setShowInput(true);
  };

  const allDatesFilled = selected.every((c) => c.arrival && c.leaving);
  const noOverlap = validateNoOverlap(selected);
  const canContinue = selected.length > 0 && allDatesFilled && onset && noOverlap;

  return (
    <div className="space-y-6">

      {/* Country Search */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">Countries visited in the past 21 days</h2>

        {!showInput && (
          <button type="button" onClick={addAnother} className={clsx(btnSecondary, "flex items-center gap-1.5")}>
            <Plus className="w-3.5 h-3.5" /> Add another country
          </button>
        )}

        {showInput && (
          <div className="relative max-w-sm">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Start typing a country name…"
              className={inputStyles}
            />
            {open && query && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                <ul className="max-h-56 overflow-auto custom-scrollbar">
                  {filtered.length > 0 ? (
                    filtered.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addCountry(name)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          {name}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-sm text-slate-400">No matches found</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Country rows */}
      <div className="space-y-3">
        {selected.length === 0 ? (
          <p className="text-sm text-slate-400">No countries added yet.</p>
        ) : (
          selected.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-slate-900">{c.name}</span>
                <button type="button" onClick={() => removeRow(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash className="w-4 h-4" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Arrival</span>
                  <ResponsiveDatePicker value={c.arrival} onChange={(val) => updateDates(c.id, "arrival", val)} />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Departure</span>
                  <ResponsiveDatePicker value={c.leaving} onChange={(val) => updateDates(c.id, "leaving", val)} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Symptom onset */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-semibold text-slate-900 mb-3">Date of Symptom Onset</label>
        <div className="max-w-xs">
          <ResponsiveDatePicker value={onset} onChange={(val) => setOnset(val)} />
        </div>
        <p className="mt-2 text-xs text-slate-400">Used to calculate the 21-day incubation window.</p>
      </div>

      {!noOverlap && <DecisionCard tone="red" title="Invalid dates"><p>Overlapping dates detected. Please adjust.</p></DecisionCard>}
      {selected.length > 0 && !allDatesFilled && <DecisionCard tone="amber" title="Missing dates"><p>Please enter arrival and departure dates for each country.</p></DecisionCard>}

      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
        <button type="button" onClick={onBackToScreen} className={btnSecondary}>Back</button>
        <button type="button" onClick={onReset} className={btnSecondary}>Reset</button>
        <button type="button" disabled={!canContinue} onClick={onContinue} className={btnPrimary}>Continue</button>
      </div>
    </div>
  );
}
