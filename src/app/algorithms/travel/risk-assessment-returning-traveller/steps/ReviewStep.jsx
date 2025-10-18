// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ReviewStep.jsx
"use client";

import DecisionCard from "@/components/DecisionCard";
import { normalizeName } from "@/utils/names";

function daysBetween(d1, d2) {
  try {
    const ms = new Date(d2).getTime() - new Date(d1).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function formatDDMMYYYY(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (disease = "") => txt(disease).includes("no known hcid");
const isTravelAssociated = (disease = "") => txt(disease).includes("travel associated");
const isImportedOnly = (evidence = "") => txt(evidence).includes("imported cases only");

// Normalise country names for matching
const normalizeName = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Countries for MERS prompt (include both “Saudi Arabia” and “Kingdom of Saudi Arabia”)
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
  ].map(normalizeName)
);

export default function ReviewStep({
  selected,
  onset,
  meta,
  normalizedMap, // Map<normalizedCountryName, entries[]>
  onBackToSelect,
  onReset,
  onContinueToExposures,
  // Optional screening answers for future print/export
  q1Fever,
  q2Exposure,
}) {
  const onsetDate = onset ? new Date(onset) : null;

  let anyRed = false;

  const cards = selected.map((c, idx) => {
    const leavingDate = c.leaving ? new Date(c.leaving) : null;
    const diffFromLeaving =
      leavingDate && onsetDate ? daysBetween(leavingDate, onsetDate) : null;
    const outside21 = diffFromLeaving !== null && diffFromLeaving > 21;

    const key = normalizeName(c.name || "");
    const entries = normalizedMap.get(key) || [];

    // Country card separator (keeps the original layout)
    const Separator = () =>
      idx > 0 ? (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 -mt-2" />
      ) : null;

    // Helper: render MERS prompt when criteria met (≤14 days & country in list)
    const renderMersNotice = () => {
      const countryInMers = MERS_COUNTRIES.has(normalizeName(c.name || ""));
      const within14 =
        diffFromLeaving !== null && typeof diffFromLeaving === "number" && diffFromLeaving <= 14;
      if (!countryInMers || !within14) return null;

      return (
        <div className="mt-3 rounded-lg border-2 border-slate-300 dark:border-slate-700 p-3 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-medium">Note:</span> Risk of MERS in this country (onset within 14 days of departure).
          </div>
          <a
            href="/algorithms/travel/mers-risk-assessment"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3
                       text-sm font-medium text-white
                       bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70
                       disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Go to MERS risk assessment
          </a>
        </div>
      );
    };

    // 1) Outside 21 days ⇒ green info
    if (outside21) {
      return (
        <div key={c.id}>
          <Separator />
          <DecisionCard tone="green" title={`${c.name} — Outside 21-day incubation window`}>
            <p>
              Symptom onset is {diffFromLeaving} day{diffFromLeaving === 1 ? "" : "s"} after
              leaving {c.name}, which is beyond the typical 21-day incubation period of viral
              haemorrhagic fevers.
            </p>
          </DecisionCard>
          {renderMersNotice()}
        </div>
      );
    }

    // 2) No known HCIDs ⇒ green
    const hasNoKnown = entries.some((e) => isNoKnownHcid(e.disease)) || entries.length === 0;
    if (hasNoKnown) {
      return (
        <div key={c.id}>
          <Separator />
          <DecisionCard tone="green" title={`${c.name} — No HCIDs listed`}>
            <p>No HCIDs are listed for this country on the UKHSA country-specific risk page.</p>
          </DecisionCard>
          {renderMersNotice()}
        </div>
      );
    }

    // 3) Only travel-associated / imported-only ⇒ green (with link)
    const everyIsTravelish = entries.every(
      (e) => isTravelAssociated(e.disease) || isImportedOnly(e.evidence) || isNoKnownHcid(e.disease)
    );
    if (everyIsTravelish) {
      return (
        <div key={c.id}>
          <Separator />
          <DecisionCard tone="green" title={`${c.name} — Travel-associated cases only`}>
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
          </DecisionCard>
          {renderMersNotice()}
        </div>
      );
    }

    // 4) Otherwise ⇒ red with disease bullets
    anyRed = true;
    const listed = entries.filter(
      (e) => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease)
    );
    return (
      <div key={c.id}>
        <Separator />
        <DecisionCard tone="red" title={`${c.name} — Consider the following:`}>
          <ul className="mt-1 list-disc pl-5">
            {listed.map((e, i) => (
              <li key={i}>
                <span className="font-medium">{e.disease}</span>
                {e.evidence ? ` — ${e.evidence}` : ""}
                {e.year ? ` (${e.year})` : ""}
              </li>
            ))}
          </ul>
        </DecisionCard>
        {renderMersNotice()}
      </div>
    );
  });

  const allGreen = selected.length > 0 && !anyRed;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Review countries and risks
      </h2>

      {/* GOV.UK snapshot card with link + DD/MM/YYYY date */}
      {meta?.source === "fallback" && (
        <div className="rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-900 dark:text-amber-200">
          ⚠ Using local HCID snapshot (captured {formatDDMMYYYY(meta.snapshotDate)}). For the latest information, always check{" "}
          <a
            href="https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            GOV.UK
          </a>.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: countries */}
        <div className="lg:col-span-2 space-y-6">{cards}</div>

        {/* Right: outcome panel */}
        <div className="lg:col-span-1 lg:sticky lg:top-4 h-fit space-y-2">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Outcome of risk assessment
          </div>

          {allGreen ? (
            <DecisionCard tone="green" title="VHF unlikely; manage locally">
              <p>Please continue standard local management pathways.</p>
            </DecisionCard>
          ) : (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Continue below when ready.
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBackToSelect}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700
                     hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))]"
        >
          Back to travel details
        </button>

        {!allGreen && (
          <button
            type="button"
            onClick={onContinueToExposures}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3
                       text-sm font-medium text-white
                       bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70
                       disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Continue to exposure questions
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700
                     hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))]"
        >
          New assessment
        </button>
      </div>
    </div>
  );
}
