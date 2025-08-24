// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ReviewStep.jsx
"use client";

import { useEffect, useMemo } from "react";
import { normalizeName, ALIASES } from "@/utils/names";
import { sortSelected } from "@/utils/travelDates";

export default function ReviewStep({
  selected, onset,
  meta, normalizedMap,
  refresh,                 // () => void (fetch /api/hcid)
  onBackToSelect,          // () => void
  onReset,                 // () => void
}) {
  // Fetch map when we land on Review
  useEffect(() => {
    refresh?.();
  }, [refresh]);

  const reviewList = useMemo(() => {
    const daysFromLeavingToOnset = (leavingISO) => {
      if (!onset || !leavingISO) return null;
      try {
        const o = new Date(onset + "T00:00:00");
        const l = new Date(leavingISO + "T00:00:00");
        return Math.floor((o - l) / (1000 * 60 * 60 * 24));
      } catch {
        return null;
      }
    };

    return sortSelected(selected).map((c) => {
      const diff = daysFromLeavingToOnset(c.leaving);

      if (diff !== null && diff > 21) {
        return {
          ...c,
          level: "green",
          header: "Outside 21‑day window",
          message: `Symptom onset is ${diff} days after leaving ${c.name} — outside the 21‑day VHF incubation window.`,
          entries: [],
        };
      }

      const entries = getEntriesForCountry(c.name, normalizedMap);

      if (entries === null) {
        return {
          ...c,
          level: "amber",
          header: "Verify current risk on GOV.UK",
          message:
            "We could not confirm HCID data programmatically for this country. Please verify the country‑specific risk page.",
          entries: [],
        };
      }

      // Classify entries:
      // - Ignore markers like "No known HCIDs" / "No other known HCIDs" / "travel associated cases as below"
      // - Treat "(c) Imported cases only" as travel-associated (green note)
      // - Everything else counts as HCID presence (red)
      const NON_HCID_MARKERS = new Set([
        "no known hcid",
        "no known hcids",
        "no other known hcid",
        "no other known hcids",
        "travel associated cases as below",
      ]);

      const realEntries = [];
      const importedOnly = [];

      for (const e of entries) {
        const label = (e?.disease || "").toLowerCase().trim();
        if (NON_HCID_MARKERS.has(label)) continue;

        const ev = (e?.evidence || "").toLowerCase();
        if (ev.includes("imported cases only")) {
          importedOnly.push(e);
          continue;
        }

        // Any other evidence (community/zoonotic, limited local, serology, unknown)
        realEntries.push(e);
      }

      if (realEntries.length === 0) {
        // No HCID presence indicated for this country; show green.
        const hasImported = importedOnly.length > 0;
        return {
          ...c,
          level: "green",
          header: hasImported ? "No UKHSA‑listed HCIDs; imported cases reported" : "No UKHSA‑listed HCIDs",
          message: hasImported
            ? "GOV.UK notes travel‑associated (imported) cases have been reported:"
            : "GOV.UK indicates no specific HCID risk listed for this country.",
          entries: importedOnly, // show imported diseases as an informational list
        };
      }

      // Otherwise, there is HCID presence for this country
      return {
        ...c,
        level: "red",
        header: "Consider the following HCIDs",
        message:
          "Within 21 days of travel from a country with UKHSA‑listed HCID occurrence.",
        entries: realEntries,
      };
    });
  }, [selected, onset, normalizedMap]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Country‑specific risk review
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToSelect}
            className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium hover:border-violet-500 dark:hover:border-violet-400"
            title="Edit travel"
          >
            ← Edit travel
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
            title="Start a new assessment"
          >
            Reset assessment
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Source: GOV.UK HCID country‑specific risk.{" "}
        <a
          href="https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Open page
        </a>
        {meta?.lastUpdatedText && (
          <span className="ml-1">
            · Last updated (GOV.UK):{" "}
            {new Date(meta.lastUpdatedText).toLocaleDateString()}
          </span>
        )}
        {meta?.source === "snapshot-fallback" && (
          <span className="ml-1 text-amber-700 dark:text-amber-400">
            ⚠️ Using a cached copy of country risk data
            {meta.snapshotDate ? ` (last updated ${meta.snapshotDate})` : ""}.
            For patient care decisions, always verify the latest information on{" "}
            <a
              href="https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              GOV.UK
            </a>.
          </span>
        )}
      </p>

      <div className="grid gap-4">
        {reviewList.map((c) => {
          const colorClasses =
            c.level === "green"
              ? "border-emerald-400 dark:border-emerald-500"
              : c.level === "red"
              ? "border-rose-500 dark:border-rose-500"
              : "border-amber-400 dark:border-amber-500";

          const badge =
            c.level === "green"
              ? { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-300", label: "Low concern" }
              : c.level === "red"
              ? { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-800 dark:text-rose-300", label: "Flag" }
              : { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-300", label: "Verify" };

          return (
            <div key={`review-${c.id}`} className={`rounded-xl border-2 p-4 bg-white dark:bg-slate-950 ${colorClasses}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">Travel: {c.arrival} → {c.leaving}</div>
                </div>
                <div className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </div>
              </div>

              <p className="mt-2 text-sm">
                <span className="font-medium">{c.header}:</span> {c.message}
              </p>

              {c.entries && c.entries.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {c.entries.map((e, idx) => (
                    <li key={`${e.disease}-${idx}`}>
                      {e.disease}
                      {(e.evidence || e.year) && (
                        <span className="text-slate-600 dark:text-slate-300">
                          {" — "}
                          <em>
                            {e.evidence || "Evidence not stated"}
                            {e.year ? ` (${e.year})` : ""}
                          </em>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          type="button"
          className="rounded-lg px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-not-allowed"
          title="Next step coming up: exposure questions and actions"
        >
          Next step (coming up)
        </button>
      </div>
    </div>
  );
}

/** Lookup helper: returns [] if known 0-risk, array of entries if risk, or null if unknown. */
function getEntriesForCountry(displayName, normMap) {
  if (!normMap) return null;
  let norm = normalizeName(displayName);
  if (ALIASES[norm]) norm = ALIASES[norm];

  if (normMap.has(norm)) return normMap.get(norm);

  for (const [key, entries] of normMap.entries()) {
    if (key.includes(norm) || norm.includes(key)) return entries;
  }

  const tokens = norm.split(" ").filter(Boolean);
  for (const [key, entries] of normMap.entries()) {
    let hits = 0;
    for (const t of tokens) if (key.includes(t)) hits++;
    if (tokens.length && hits / tokens.length >= 0.66) return entries;
  }

  return null;
}
