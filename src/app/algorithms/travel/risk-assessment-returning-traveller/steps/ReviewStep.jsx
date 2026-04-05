"use client";

import DecisionCard from "@/components/DecisionCard";
import { normalizeName } from "@/utils/names";

const btnPrimary =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand hover:opacity-90 text-white text-sm font-semibold transition-opacity " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

const btnSecondary =
  "px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-slate-400 text-sm font-medium transition-colors";

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

const MERS_COUNTRIES = new Set(
  ["bahrain", "jordan", "iraq", "iran", "kingdom of saudi arabia", "saudi arabia", "kuwait", "oman", "qatar", "united arab emirates", "yemen", "kenya"].map(normalizeName)
);

export default function ReviewStep({
  selected, onset, meta, normalizedMap, onBackToSelect, onReset, onContinueToExposures,
}) {
  const onsetDate = onset ? new Date(onset) : null;
  let anyRed = false;

  const cards = selected.map((c, idx) => {
    const leavingDate = c.leaving ? new Date(c.leaving) : null;
    const diffFromLeaving = leavingDate && onsetDate ? daysBetween(leavingDate, onsetDate) : null;
    const outside21 = diffFromLeaving !== null && diffFromLeaving > 21;

    const key = normalizeName(c.name || "");
    const entries = normalizedMap.get(key) || [];

    const Separator = () => idx > 0 ? <div className="border-t border-slate-200 pt-6 -mt-2" /> : null;

    const renderMersNotice = () => {
      const countryInMers = MERS_COUNTRIES.has(normalizeName(c.name || ""));
      const within14 = diffFromLeaving !== null && typeof diffFromLeaving === "number" && diffFromLeaving <= 14;
      if (!countryInMers || !within14) return null;
      return (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Note:</span> Risk of MERS in this country (onset &le; 14 days).
          </div>
          <a
            href="/algorithms/travel/mers-risk-assessment"
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 border border-amber-300 rounded px-3 py-1.5 hover:bg-amber-100 transition-colors"
          >
            Check MERS Risk
          </a>
        </div>
      );
    };

    if (outside21) {
      return (
        <div key={c.id}>
          <Separator />
          <DecisionCard tone="green" title={`${c.name} — Outside 21-day incubation`}>
            <p>Symptom onset is {diffFromLeaving} days after leaving, beyond the 21-day VHF incubation.</p>
          </DecisionCard>
          {renderMersNotice()}
        </div>
      );
    }

    const hasNoKnown = entries.some((e) => isNoKnownHcid(e.disease)) || entries.length === 0;
    if (hasNoKnown) {
      return (
        <div key={c.id}>
          <Separator />
          <DecisionCard tone="green" title={`${c.name} — No HCIDs listed`}>
            <p>No HCIDs listed for this country on UKHSA.</p>
          </DecisionCard>
          {renderMersNotice()}
        </div>
      );
    }

    const everyIsTravelish = entries.every(e => isTravelAssociated(e.disease) || isImportedOnly(e.evidence) || isNoKnownHcid(e.disease));
    if (everyIsTravelish) {
      return (
        <div key={c.id}>
          <Separator />
          <DecisionCard tone="green" title={`${c.name} — Travel-associated cases only`}>
            <p>
              Travel-associated cases reported. Check <a href="https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">GOV.UK</a>.
            </p>
          </DecisionCard>
          {renderMersNotice()}
        </div>
      );
    }

    anyRed = true;
    const listed = entries.filter(e => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease));
    return (
      <div key={c.id}>
        <Separator />
        <DecisionCard tone="red" title={`${c.name} — Consider the following:`}>
          <ul className="mt-1 list-disc pl-5">
            {listed.map((e, i) => (
              <li key={i}>
                <span className="font-semibold">{e.disease}</span>
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
      <h2 className="text-base font-semibold text-slate-900">Review Countries & Risks</h2>

      {meta?.source === "fallback" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          Using local snapshot ({formatDDMMYYYY(meta.snapshotDate)}). Check GOV.UK for latest data.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">{cards}</div>
        <div className="lg:col-span-1 lg:sticky lg:top-4 h-fit space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assessment Outcome</p>
          {allGreen ? (
            <DecisionCard tone="green" title="VHF Unlikely">
              <p>Manage locally.</p>
            </DecisionCard>
          ) : (
            <p className="text-sm text-slate-400">Continue to exposure questions below.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
        <button type="button" onClick={onBackToSelect} className={btnSecondary}>Back</button>
        <button type="button" onClick={onReset} className={btnSecondary}>Reset</button>
        {!allGreen && (
          <button type="button" onClick={onContinueToExposures} className={btnPrimary}>
            Continue to Exposure Questions
          </button>
        )}
      </div>
    </div>
  );
}
