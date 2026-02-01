"use client";

import { useEffect, useMemo } from "react";
import DecisionCard from "@/components/DecisionCard";
import { vhfCountryNames } from "@/data/vhfCountries";
import { Trash, Plus } from "lucide-react";
import ResponsiveDatePicker from "src/app/algorithms/travel/travel-history-generator/_components/ui/ResponsiveDatePicker.js"; 
import { normalizeName } from "@/utils/names";

// --- THEME CONSTANTS ---
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 " +
  "text-sm font-bold font-mono tracking-wide text-white uppercase " +
  "bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition-all";

const btnSecondary =
  "rounded-lg px-4 py-2 border border-neutral-800 bg-neutral-900 text-neutral-400 " +
  "hover:text-white hover:border-neutral-600 text-xs font-bold font-mono uppercase tracking-wide transition-all";

const inputStyles = 
  "w-full rounded bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white " +
  "placeholder:text-neutral-600 focus:border-red-500 focus:outline-none transition-colors";

// -----------------------

const uid = () => Math.random().toString(36).slice(2, 9);

const sortByLeaving = (arr) =>
  [...arr].sort((a, b) => {
    const ta = a.leaving ? new Date(a.leaving).getTime() : 0;
    const tb = b.leaving ? new Date(b.leaving).getTime() : 0;
    return ta - tb;
  });

function validateNoOverlap(rows) {
  const sorted = sortByLeaving(rows);
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
    // FIX: strict usage of normalizeName from utils
    const q = normalizeName(query);
    if (!q) return [];
    const out = [];
    for (const name of vhfCountryNames) {
      if (normalizeName(name).includes(q)) {
        out.push(name);
        if (out.length >= 12) break;
      }
    }
    return out;
  }, [query]);

  useEffect(() => {
    if (showInput) setTimeout(() => inputRef?.current?.focus(), 0);
  }, [showInput, inputRef]);

  const addCountry = (name) => {
    if (!name) return;
    setSelected((prev) => sortByLeaving([...prev, { id: uid(), name, arrival: "", leaving: "" }]));
    setQuery("");
    setOpen(false);
    setShowInput(false);
  };

  const addAnother = () => {
    setShowInput(true);
    setQuery("");
    setOpen(false);
    setTimeout(() => inputRef?.current?.focus(), 0);
  };

  const updateDates = (id, field, value) => {
    setSelected((prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        if (field === "arrival") {
          const leavingOk = c.leaving && value && new Date(value) > new Date(c.leaving) ? "" : c.leaving || "";
          return { ...c, arrival: value, leaving: leavingOk };
        }
        if (field === "leaving") {
          let newLeaving = value;
          if (c.arrival && value && new Date(value) < new Date(c.arrival)) {
            newLeaving = c.arrival;
          }
          return { ...c, leaving: newLeaving };
        }
        return c;
      });
      return sortByLeaving(next);
    });
  };

  const removeRow = (id) => {
    setSelected((prev) => prev.filter((c) => c.id !== id));
    if (selected.length <= 1) setShowInput(true);
  };

  const allDatesFilled = selected.every((c) => c.arrival && c.leaving);
  const noOverlap = validateNoOverlap(selected);
  const canContinue = selected.length > 0 && allDatesFilled && onset && noOverlap;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Country / Countries of Travel</h2>
        
        {!showInput && (
          <button type="button" onClick={addAnother} className={btnSecondary}>
            <Plus className="w-4 h-4 mr-2 inline" /> Add another country
          </button>
        )}

        {showInput && (
          <div className="relative max-w-xl">
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
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-2xl">
                <ul className="max-h-64 overflow-auto custom-scrollbar">
                  {filtered.length > 0 ? (
                    filtered.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addCountry(name)}
                          className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                        >
                          {name}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-sm text-neutral-500 font-mono">NO_MATCHES_FOUND</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {selected.length === 0 ? (
          <p className="text-sm text-neutral-500 font-mono">No countries added. Use the search box above.</p>
        ) : (
          selected.map((c) => (
            <div key={c.id} className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-5 transition-all hover:border-neutral-700">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="font-bold text-white text-lg">{c.name}</div>
                <button
                  type="button"
                  onClick={() => removeRow(c.id)}
                  className="text-neutral-500 hover:text-red-500 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-mono font-bold text-neutral-500 uppercase mb-2">Arrival</span>
                  <ResponsiveDatePicker
                    value={c.arrival}
                    onChange={(val) => updateDates(c.id, "arrival", val)}
                  />
                </div>

                <div>
                  <span className="block text-xs font-mono font-bold text-neutral-500 uppercase mb-2">Leaving</span>
                  <ResponsiveDatePicker
                    value={c.leaving}
                    onChange={(val) => updateDates(c.id, "leaving", val)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-6 border-t border-neutral-800">
        <label className="block text-sm font-bold text-white mb-2">Date of Symptom Onset</label>
        <div className="max-w-xs">
            <ResponsiveDatePicker
              value={onset}
              onChange={(val) => setOnset(val)}
            />
        </div>
        <p className="mt-2 text-xs text-neutral-500 font-mono">Needed to calculate 21‑day window.</p>
      </div>

      {!noOverlap && (
        <DecisionCard tone="red" title="Invalid Dates">
          <p className="text-neutral-300">Overlapping dates detected. Please adjust.</p>
        </DecisionCard>
      )}
      {selected.length > 0 && !allDatesFilled && (
        <DecisionCard tone="red" title="Missing Dates">
          <p className="text-neutral-300">Please enter arrival and leaving dates for each country.</p>
        </DecisionCard>
      )}

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onBackToScreen} className={btnSecondary}>Back</button>
        <button type="button" onClick={onReset} className={btnSecondary}>Reset</button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={btnPrimary}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
