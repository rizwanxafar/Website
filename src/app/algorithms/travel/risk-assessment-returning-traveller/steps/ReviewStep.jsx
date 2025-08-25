// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ReviewStep.jsx
"use client";

import DecisionCard from "@/components/DecisionCard";

// Local helper: whole-day difference (d2 - d1) in days
function daysBetween(d1, d2) {
  try {
    const ms = new Date(d2).getTime() - new Date(d1).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

const isTravelAssocPhrase = (s = "") =>
  s.toLowerCase().includes("travel associated");

const isNoKnownHcidPhrase = (s = "") =>
  s.toLowerCase().includes("no known hcid");

export default function ReviewStep({
  selected,
  onset,
  meta,
  normalizedMap,   // Map<normalizedCountryName, entries[]>
  refresh,
  onBackToSelect,
  onReset,
}) {
  const onsetDate = onset ? new Date(onset) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Review countries and risks
      </h2>

      {/* Snapshot warning banner */}
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

      <div className="space-y-4">
        {selected.map((c) => {
          // Timing
          const arrivalDate = c.arrival ? new Date(c.arrival) : null;
          const leavingDate = c.leaving ? new Date(c.leaving) : null;
          const diffFromLeaving =
            leavingDate && onsetDate ? daysBetween(leavingDate, onsetDate) : null;

          const beyond21 = diffFromLeaving !== null && diffFromLeaving > 21;
          const withinStay =
            arrivalDate && leavingDate && onsetDate
              ? onsetDate >= arrivalDate && onsetDate <= leavingDate
              : false;
          // Treat as "within window" when not beyond 21 OR explicitly within the stay
          const withinWindow = (diffFromLeaving !== null && diffFromLeaving <= 21) || withinStay;

          // Risk data
          const key = String(c.name || "").toLowerCase();
          const entries = normalizedMap.get(key) || [];

          const realRisks = entries.filter(
            (e) =>
              !isNoKnownHcidPhrase(e.disease) &&
              !isTravelAssocPhrase(e.disease)
          );

          const hasOnlyTravelAssoc =
            entries.length > 0 && realRisks.length === 0 &&
            entries.some((e) => isTravelAssocPhrase(e.disease));

          // Decide colour & content
          let tone = "green";
          let title = "";
          let badge = "Low risk";
          let detailsNode = null;

          if (beyond21) {
            // 1) Outside incubation window → GREEN regardless of HCIDs
            tone = "green";
            badge = "Low risk";
            title = `${c.name} — Outside 21-day incubation window`;
            const d = diffFromLeaving; // already > 21
            detailsNode = (
              <p>
                Symptom onset is {d} day{d === 1 ? "" : "s"} after leaving {c.name}, which is beyond the
                typical 21-day incubation period of viral haemorrhagic fevers.
              </p>
            );
          } else if (withinWindow) {
            if (realRisks.length > 0) {
              // 2a) Within window AND real HCIDs listed → RED
              tone = "red";
              badge = "At risk";
              title = `${c.name} — Consider the following`;
              detailsNode = (
                <ul className="mt-2 list-disc pl-5">
                  {realRisks.map((r, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{r.disease}</span>
                      {r.evidence ? ` — ${r.evidence}` : ""}
                      {r.year ? ` (${r.year})` : ""}
                    </li>
                  ))}
                </ul>
              );
            } else if (hasOnlyTravelAssoc) {
              // 2b) Within window BUT only travel-associated mentions → GREEN
              tone = "green";
              badge = "Low risk";
              title = `${c.name} — No HCIDs listed`;
              detailsNode = (
                <p>
                  This country has had <span className="font-medium">travel-associated cases only</span>;
                  no HCIDs are listed for local/community transmission.
                </p>
              );
            } else {
              // 2c) Within window and no entries at all → GREEN
              tone = "green";
              badge = "Low risk";
              title = `${c.name} — VHF unlikely`;
              detailsNode = <p>No HCIDs are mentioned for this country.</p>;
            }
          } else {
            // 3) Unknown timing relationship (dates missing or unparsable) → default GREEN, neutral text
            tone = "green";
            badge = "Low risk";
            title = `${c.name} — VHF unlikely`;
            detailsNode = <p>Dates could not be compared; no specific HCID flagged.</p>;
          }

          return (
            <DecisionCard key={c.id} tone={tone} title={title}>
              {/* Badge row + details */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">{detailsNode}</div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold border
                  ${
                    tone === "red"
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800"
                  }`}
                  title={
                    tone === "red"
                      ? "Within 21 days and HCIDs listed"
                      : beyond21
                      ? "Outside 21-day incubation window"
                      : hasOnlyTravelAssoc
                      ? "Travel-associated cases only"
                      : "No HCIDs listed"
                  }
                >
                  {badge}
                </span>
              </div>
            </DecisionCard>
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
          onClick={refresh}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400"
        >
          Refresh GOV.UK data
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
        >
          New assessment
        </button>
      </div>

      {/* Source note */}
      {meta && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Source: GOV.UK HCID country risk.{" "}
          {meta.source === "fallback"
            ? `Using local snapshot (captured ${meta.snapshotDate}).`
            : meta.lastUpdatedText
            ? `Last updated ${meta.lastUpdatedText}.`
            : ""}
        </p>
      )}
    </div>
  );
}
