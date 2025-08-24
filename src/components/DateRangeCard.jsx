// src/components/DateRangeCard.jsx
"use client";

import { todayISO } from "@/utils/travelDates";

export default function DateRangeCard({
  country,
  status,              // "ok" | "invalid-range" | "incomplete" | "future-date"
  hasConflict,         // boolean
  onChangeDate,        // (id, field, value) => void
}) {
  const arrivalMax =
    country.leaving ? (country.leaving < todayISO ? country.leaving : todayISO) : todayISO;
  const leavingMin = country.arrival || undefined;

  let warnText = "";
  if (status === "invalid-range") warnText = "Leaving date must be the same as or after the arrival date.";
  else if (status === "incomplete") warnText = "Please choose both arrival and leaving dates.";
  else if (status === "future-date") warnText = "Dates cannot be in the future.";
  else if (hasConflict) warnText = "These dates overlap with another country. Adjust to avoid overlap.";

  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        hasConflict
          ? "border-rose-500 bg-rose-50/40 dark:border-rose-500 dark:bg-rose-900/20"
          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
      }`}
    >
      <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
        {country.name} — travel dates
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
            Arrival date
          </label>
          <input
            type="date"
            value={country.arrival}
            onChange={(e) => onChangeDate(country.id, "arrival", e.target.value)}
            className={`w-full rounded-lg border-2 px-3 py-2 focus:outline-none focus:ring-2 ${
              hasConflict
                ? "border-rose-400 dark:border-rose-500 focus:ring-rose-300"
                : "border-slate-300 dark:border-slate-700 focus:ring-violet-400 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            }`}
            max={arrivalMax}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
            Leaving date
          </label>
          <input
            type="date"
            value={country.leaving}
            onChange={(e) => onChangeDate(country.id, "leaving", e.target.value)}
            className={`w-full rounded-lg border-2 px-3 py-2 focus:outline-none focus:ring-2 ${
              hasConflict
                ? "border-rose-400 dark:border-rose-500 focus:ring-rose-300"
                : "border-slate-300 dark:border-slate-700 focus:ring-violet-400 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            }`}
            min={leavingMin}
            max={todayISO}
          />
        </div>
      </div>

      {(status !== "ok" || hasConflict) && (
        <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">{warnText}</p>
      )}
    </div>
  );
}
