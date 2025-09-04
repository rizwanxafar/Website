// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ReviewStep.jsx
"use client";

import { useMemo } from "react";
import DecisionCard from "@/components/DecisionCard";

// ---- THEME HELPERS ----
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 " +
  "text-sm font-medium text-white " +
  "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition";

const btnSecondary =
  "rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))]";
// -----------------------

// Normalisers/helpers
const norm = (s = "") =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const daysBetween = (a, b) => {
  if (!a || !b) return null;
  const A = new Date(a);
  const B = new Date(b);
  const ms = B.getTime() - A.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const sortByLeaving = (arr) =>
  [...arr].sort((x, y) => {
    const tx = x.leaving ? new Date(x.leaving).getTime() : 0;
    const ty = y.leaving ? new Date(y.leaving).getTime() : 0;
    return tx - ty;
  });

// Risk helpers (unchanged logic)
const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (disease = "") => txt(disease).includes("no known hcid");
const isTravelAssociated = (disease = "") => txt(disease).includes("travel associated");
const isImportedOnly = (evidence = "") => txt(evidence).includes("imported cases only");

const hasTrueHcid = (entries = []) =>
  (entries || []).some(
    (e) =>
      !isNoKnownHcid(e?.disease) &&
      !isTravelAssociated(e?.disease) &&
      !isImportedOnly(e?.evidence)
  );

// ---- NEW: MERS notice helpers ----
const MERS_COUNTRIES = new Set(
  [
    "bahrain",
    "jordan",
    "iraq",
    "iran",
    "kingdom of saudi arabia",
    "saudi arabia",
    "kuwait",
    "oman",
    "qatar",
    "united arab emirates",
    "yemen",
    "kenya",
  ].map(norm)
);

const withinMersWindow = (leaving, onset) => {
  const d = daysBetween(leaving, onset);
  return d !== null && d <= 14;
};

// Snapshot date formatter -> DD/MM/YYYY
const formatSnapshot = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return null;
  return `${d}/${m}/${y}`;
};

export default function ReviewStep({
  selected,
  onset,
  meta,               // { source, lastUpdatedText, snapshotDate } (may be null)
  normalizedMap,      // Map<normalizedCountryName, [{ disease, evidence, year }...]>
  onBackToSelect,
  onReset,
  onContinueToExposures,
}) {
  // Keep ordering by leaving date
  const ordered = useMemo(() => sortByLeaving(selected || []), [selected]);

  // Build country assessments (unchanged logic), with extra MERS row when applicable
  const cards = useMemo(() => {
    return ordered.map((row) => {
      const key = norm(row.name);
      const entries = normalizedMap.get(key) || [];
      const diff = daysBetween(row.leaving, onset);

      // Outside incubation window => GREEN
      if (diff !== null && diff > 21) {
        return {
          id: row.id,
          name: row.name,
          tone: "green",
          heading: "Outside 21-day incubation window",
          body: (
            <p className="text-sm">
              Symptom onset is <strong>{diff} days</strong> after leaving <strong>{row.name}</strong>,
              which is beyond the typical 21-day incubation period of viral haemorrhagic fevers.
            </p>
          ),
          mersNotice:
            MERS_COUNTRIES.has(norm(row.name)) && withinMersWindow(row.leaving, onset)
              ? true
              : false,
        };
      }

      // Within 21 days: check GOV.UK entries
      const anyTrue = hasTrueHcid(entries);
      const onlyTravelOrNone =
        entries.length === 0 ||
        entries.every((e) => isNoKnownHcid(e.disease) || isTravelAssociated(e.disease) || isImportedOnly(e.evidence));

      if (onlyTravelOrNone) {
        // GREEN (no known HCIDs; possibly travel-associated mentions)
        const hasTravelMention = entries.some((e) => isTravelAssociated(e.disease) || isImportedOnly(e.evidence));
        return {
          id: row.id,
          name: row.name,
          tone: "green",
          heading: "No known HCIDs",
          body: (
            <div className="text-sm space-y-1">
              <p>
                GOV.UK lists <strong>no known HCIDs</strong> for <strong>{row.name}</strong>.
              </p>
              {hasTravelMention && (
                <p>
                  Note: there are <strong>travel-associated</strong> mentions only; consider routine differentials and
                  check official sources if needed.
                </p>
              )}
            </div>
          ),
          mersNotice:
            MERS_COUNTRIES.has(norm(row.name)) && withinMersWindow(row.leaving, onset)
              ? true
              : false,
        };
      }

      // RED with list of HCIDs + evidence
      const bullets = entries
        .filter((e) => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease) && !isImportedOnly(e.evidence))
        .map((e, idx) => (
          <li key={idx}>
            <span className="font-medium">{e.disease}</span>
            {e.evidence ? <span className="text-slate-600 dark:text-slate-300"> — {e.evidence}</span> : null}
            {e.year ? <span className="text-slate-500 dark:text-slate-400"> ({e.year})</span> : null}
          </li>
        ));

      return {
        id: row.id,
        name: row.name,
        tone: "red",
        heading: `Consider the following`,
        body: <ul className="list-disc pl-5 text-sm">{bullets}</ul>,
        mersNotice:
          MERS_COUNTRIES.has(norm(row.name)) && withinMersWindow(row.leaving, onset)
            ? true
            : false,
      };
    });
  }, [ordered, onset, normalizedMap]);

  const anyRed = cards.some((c) => c.tone === "red");
  const allGreen = cards.length > 0 && cards.every((c) => c.tone === "green");

  const snapshotText = formatSnapshot(meta?.snapshotDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: country cards */}
      <div className="lg:col-span-2 space-y-4">
        {cards.length === 0 ? (
          <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No countries added yet. Go back and add at least one country with travel dates.
            </p>
          </div>
        ) : (
          cards.map((c) => (
            <div key={c.id} className="rounded-xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b-2 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{c.name}</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <DecisionCard tone={c.tone} title={c.heading}>
                  {c.body}
                </DecisionCard>

                {/* NEW: MERS inline notice, when applicable */}
                {c.mersNotice && (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-slate-700 dark:text-slate-200">
                      <strong>Risk of MERS in this country.</strong>
                    </span>
                    <a
                      href="/algorithms/mers"
                      className={btnPrimary}
                    >
                      Go to MERS risk assessment
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-800" />
        <div className="flex gap-3">
          <button type="button" onClick={onBackToSelect} className={btnSecondary}>
            Back to travel details
          </button>
          <button type="button" onClick={onReset} className={btnSecondary}>
            Reset assessment
          </button>
        </div>
      </div>

      {/* Right: summary/outcome */}
      <aside className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Outcome of risk assessment
        </h2>

        {allGreen && (
          <DecisionCard tone="green" title="VHF unlikely; manage locally">
            <p className="text-sm">
              All countries either fall outside the incubation window or have no known HCIDs.
            </p>
          </DecisionCard>
        )}

        {anyRed && (
          <>
            <DecisionCard tone="amber" title="Further assessment needed">
              <p className="text-sm">
                One or more countries have relevant HCIDs within the 21-day window. Continue to exposure questions.
              </p>
            </DecisionCard>
            <button type="button" onClick={onContinueToExposures} className={btnPrimary}>
              Continue to exposure questions
            </button>
          </>
        )}

        {/* NEW: provenance note with formatted date + GOV.UK link */}
        {snapshotText && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Using local HCID snapshot (captured {snapshotText}). For the latest information, always check{" "}
            <a
              href="https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline text-[hsl(var(--brand))] dark:text-[hsl(var(--accent))]"
            >
              GOV.UK
            </a>.
          </p>
        )}
      </aside>
    </div>
  );
}
