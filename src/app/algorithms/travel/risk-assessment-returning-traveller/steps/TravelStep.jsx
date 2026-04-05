"use client";

import { useMemo } from "react";

const btnSecondary =
  "px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-slate-400 text-sm font-medium transition-colors";

const btnPrimary =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand hover:opacity-90 text-white text-sm font-semibold transition-opacity " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

const inputStyles =
  "w-full rounded-lg bg-white border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 " +
  "focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors";

export default function TravelStep({ selected = [], setSelected, onset = "", setOnset, onBack, onNext }) {
  const addExample = () => {
    const name = prompt("Enter country name:");
    if (!name) return;
    const today = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    setSelected((prev) => [...prev, { id: Math.random().toString(36).slice(2, 9), name, arrival: iso(new Date(today.getTime() - 259200000)), leaving: iso(today) }]);
  };

  const canContinue = useMemo(() => onset && selected.length > 0, [onset, selected.length]);

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-slate-900">Travel Details</h2>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Onset</label>
        <input type="date" value={onset} onChange={(e) => setOnset(e.target.value)} className={inputStyles} />
      </div>
      <div>
        <button type="button" onClick={addExample} className={btnSecondary}>+ Add Mock Country</button>
        <ul className="mt-3 space-y-2">
          {selected.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700">
              {c.name} ({c.arrival} → {c.leaving})
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <button type="button" onClick={onBack} className={btnSecondary}>Back</button>
        <button type="button" onClick={onNext} disabled={!canContinue} className={btnPrimary}>Continue</button>
      </div>
    </div>
  );
}
