// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ReviewStep.jsx
"use client";

import DecisionCard from "@/components/DecisionCard";

// whole-day difference (d2 - d1)
function daysBetween(d1, d2) {
  try {
    const ms = new Date(d2).getTime() - new Date(d1).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (disease = "") => txt(disease).includes("no known hcid");
const isTravelAssociated = (disease = "") => txt(disease).includes("travel associated");
const isImportedOnly = (evidence = "") => txt(evidence).includes("imported cases only");

export default function ReviewStep({
  selected,
  onset,
  meta,
  normalizedMap, // Map<normalizedCountryName, entries[]>
  _refresh,      // kept (unused) to avoid breaking parent props
  onBackToSelect,
  onReset,
}) {
  const onsetDate = onset ? new Date(onset) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Review countries and risks
      </h2>

      {/* Snapshot warning banner (doesn't affect colour logic) */}
      {meta?.source === "fallback" && (
        <div className="rounded-md border border-amber-400 bg-amber-50 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠ Using local HCID snapshot (captured {meta.snapshotDate}).{" "}
          For the latest country-specific HCID risk information, always check{" "}
          <a
            href="https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium hover:text-amber-600 dark:hover:text-amber-300"
          >
            GOV.UK
          </a>.
        </div>
      )}

      <div className="space-y-6">
        {selected.map((c, idx) => {
          // --- Timing checks ---
          const leavingDate = c.leaving ? new Date(c.leaving) : null;
          const diffFromLeaving =
            leavingDate && onsetDate ? daysBetween(leavingDate, onsetDate) : null;
          const outside21 = diffFromLeaving !== null && diffFromLeaving > 21;

          // --- Risk data for this country ---
          const key = String(c.name || "").toLowerCase();
          const entries = normalizedMap.get(key) || [];

          // 1) If outside incubation window => GREEN (always)
          if (outside21) {
            return (
              <div key={c.id}>
                {idx > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6 -mt-2" />
                )}
                <DecisionCard
                  tone="green"
                  title={`${c.name} — Outside 21-day incubation window`}
                >
                  <div className="relative">
                    <span className="absolute right-3 top-0 rounded-full bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold">
                      No risk
                    </span>
                    <p>
                      Symptom onset is {diffFromLeaving} day{diffFromLeaving === 1 ? "" : "s"} after
                      leaving {c.name}, which is beyond the typical 21-day incubation period of viral
                      haemorrhagic fevers.
                    </p>
                  </div>
                </DecisionCard>
              </div>
            );
          }

          // 2) Explicit "No known HCIDs" (or no entries at all) => GREEN
          const hasNoKnown = entries.some((e) => isNoKnownHcid(e.disease)) || entries.length === 0;
          if (hasNoKnown) {
            return (
              <div key={c.id}>
                {idx > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6 -mt-2" />
                )}
                <DecisionCard tone="green" title={`${c.name} — No HCIDs listed`}>
                  <div className="relative">
                    <span className="absolute right-3 top-0 rounded-full bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold">
                      No risk
                    </span>
                    <p>No HCIDs are listed for this country on the UKHSA country-specific risk page.</p>
                  </div>
                </DecisionCard>
              </div>
            );
          }

          // 3) Travel-associated only (and/or imported-only), optionally alongside "No known HCIDs" => GREEN
          const everyIsTravelish = entries.every(
            (e) => isTravelAssociated(e.disease) || isImportedOnly(e.evidence) || isNoKnownHcid(e.disease)
          );
          if (everyIsTravelish) {
            return (
              <div key={c.id}>
                {idx > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6 -mt-2" />
                )}
                <DecisionCard tone="green" title={`${c.name} — Travel-associated cases only`}>
                  <div className="relative">
                    <span className="absolute right-3 top-0 rounded-full bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold">
                      No risk
                    </span>
                    <p>
                      Travel-associated cases have been reported. For the latest context, please check{" "}
                      <a
                        href="https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        GOV.UK
                      </a>.
                    </p>
                  </div>
                </DecisionCard>
              </div>
            );
          }

          // 4) Everything else => RED (list diseases with their evidence/year)
          const listed = entries.filter(
            (e) => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease)
          );
          return (
            <div key={c.id}>
              {idx > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 -mt-2" />
              )}
              <DecisionCard tone="red" title={`${c.name} — Consider the following:`}>
                <div className="relative">
                  <span className="absolute right-3 top-0 rounded-full bg-rose-600 text-white px-2.5 py-1 text-xs font-semibold">
                    At risk
                  </span>
                  <ul className="mt-1 list-disc pl-5">
                    {listed.map((e, i) => (
                      <li key={i}>
                        <span className="font-medium">{e.disease}</span>
                        {e.evidence ? ` — ${e.evidence}` : ""}
                        {e.year ? ` (${e.year})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </DecisionCard>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBackToSelect}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400"
        >
          Back to travel details
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
        >
          New assessment
        </button>
      </div>
    </div>
  );
}
