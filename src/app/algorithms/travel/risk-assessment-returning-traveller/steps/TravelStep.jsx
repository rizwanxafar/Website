// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/TravelStep.jsx
"use client";

import { useMemo } from "react";

export default function TravelStep({ selected = [], setSelected, onset = "", setOnset, onBack, onNext }) {
  const addExample = () => {
    const name = prompt("Enter country name:");
    if (!name) return;
    const today = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    setSelected((prev) => [...prev, { id: Math.random().toString(36).slice(2, 9), name, arrival: iso(new Date(today.getTime() - 259200000)), leaving: iso(today) }]);
  };

  const canContinue = useMemo(() => onset && selected.length > 0, [onset, selected.length]);
  const btnStyle = "rounded-lg px-3 py-1.5 text-sm font-medium border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white";
  const btnNext = "rounded-lg px-3 py-1.5 text-sm font-bold bg-red-600 text-white disabled:opacity-50";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Travel Details (Dev)</h2>
      <div>
        <label className="block text-sm font-medium text-neutral-400 mb-1">Date of Onset</label>
        <input type="date" value={onset} onChange={(e) => setOnset(e.target.value)} className="w-full rounded bg-neutral-950 border border-neutral-800 px-3 py-2 text-white" />
      </div>
      <div>
        <button type="button" onClick={addExample} className={btnStyle}>+ Add Mock Country</button>
        <ul className="mt-2 space-y-2">
          {selected.map((c) => (
            <li key={c.id} className="rounded border border-neutral-800 p-2 text-sm text-neutral-300">
              {c.name} ({c.arrival} → {c.leaving})
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onBack} className={btnStyle}>Back</button>
        <button type="button" onClick={onNext} disabled={!canContinue} className={btnNext}>Continue</button>
      </div>
    </div>
  );
}
