"use client";

import DecisionCard from "@/components/DecisionCard";
import { normalizeName } from "@/utils/names";
import { format } from "date-fns";

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

// -----------------------

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

// FIX: Ensure this list matches the normalized logic
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
    
    // FIX: Single Source of Truth for Key Lookup
    const key = normalizeName(c.name || "");
    const entries = normalizedMap.get(key) || [];

    const Separator = () => idx > 0 ? <div className="border-t border-neutral-800 pt-6 -mt-2" /> : null;

    const renderMersNotice = () => {
      // FIX: Single Source of Truth for MERS lookup
      const countryInMers = MERS_COUNTRIES.has(normalizeName(c.name || ""));
      const within14 = diffFromLeaving !== null && typeof diffFromLeaving === "number" && diffFromLeaving <= 14;
      if (!countryInMers || !within14) return null;
      return (
        <div className="mt-3 rounded-lg border border-neutral-700 bg-neutral-900 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-neutral-300">
            <span className="font-bold text-amber-500">Note:</span> Risk of MERS in this country (onset &le; 14 days).
          </div>
          <a
            href="/algorithms/travel/mers-risk-assessment"
            className="text-xs font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wide border border-amber-500/30 rounded px-3 py-1.5 hover:bg-amber-950/30 transition"
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
            <p className="text-neutral-300">Symptom onset is {diffFromLeaving} days after leaving, beyond the 21-day VHF incubation.</p>
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
            <p className="text-neutral-300">No HCIDs listed for this country on UKHSA.</p>
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
            <p className="text-neutral-300">
              Travel-associated cases reported. Check <a href="https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk" target="_blank" className="underline hover:text-white">GOV.UK</a>.
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
          <ul className="mt-1 list-disc pl-5 text-neutral-300">
            {listed.map((e, i) => (
              <li key={i}>
                <span className="font-bold text-white">{e.disease}</span>
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
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-white">Review Countries & Risks</h2>

      {meta?.source === "fallback" && (
        <div className="rounded border border-amber-900/50 bg-amber-950/10 p-3 text-xs font-mono text-amber-500">
          ⚠ Using local snapshot ({formatDDMMYYYY(meta.snapshotDate)}). Check GOV.UK for latest.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">{cards}</div>
        <div className="lg:col-span-1 lg:sticky lg:top-4 h-fit space-y-4">
          <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Assessment Outcome</div>
          {allGreen ? (
            <DecisionCard tone="green" title="VHF Unlikely">
              <p className="text-neutral-300">Manage locally.</p>
            </DecisionCard>
          ) : (
            <div className="text-sm text-neutral-500 italic">Continue to exposure questions below.</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-800">
        <button type="button" onClick={onBackToSelect} className={btnSecondary}>Back</button>
        {!allGreen && (
          <button type="button" onClick={onContinueToExposures} className={btnPrimary}>
            Continue to Exposure Questions
          </button>
        )}
        <button type="button" onClick={onReset} className={btnSecondary}>Reset</button>
      </div>
    </div>
  );
}
