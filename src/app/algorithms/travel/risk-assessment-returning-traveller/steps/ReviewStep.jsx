"use client";

import DecisionCard from "@/components/DecisionCard";

export default function ReviewStep({
  selected,
  onset,
  meta,
  normalizedMap,
  refresh,
  onBackToSelect,
  onReset,
}) {
  // Helper to calculate if onset is within 21 days of leaving
  const daysBetween = (d1, d2) => {
    try {
      const diff =
        (new Date(d1).getTime() - new Date(d2).getTime()) /
        (1000 * 60 * 60 * 24);
      return Math.floor(diff);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Review countries and risks
      </h2>

      {/* 🔔 Snapshot warning banner */}
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
          const risks = normalizedMap.get(c.name.toLowerCase()) || [];
          const days = daysBetween(onset, c.leaving);
          const within21 = days !== null && days <= 21;

          let tone = "green";
          let title = "VHF unlikely";
          let details = "No HCIDs mentioned for this country.";

          if (within21 && risks.length > 0) {
            // Filter out "No known HCIDs; travel associated cases as below"
            const realRisks = risks.filter(
              (r) =>
                !r.disease.toLowerCase().includes("no known hcid") &&
                !r.disease.toLowerCase().includes("travel associated")
            );

            if (realRisks.length > 0) {
              tone = "red";
              title = `Consider ${realRisks.map((r) => r.disease).join(", ")}`;
              details = realRisks
                .map((r) => `${r.disease} — ${r.evidence} (${r.year})`)
                .join("; ");
            } else {
              tone = "green";
              title = "No HCIDs (only travel-associated cases)";
              details =
                "This country has no known HCIDs, but there have been travel-associated cases elsewhere.";
            }
          } else if (within21 && risks.length === 0) {
            tone = "green";
            title = "VHF unlikely";
            details = "No HCIDs mentioned for this country.";
          }

          return (
            <DecisionCard key={c.id} tone={tone} title={`${c.name} — ${title}`}>
              <p>{details}</p>
            </DecisionCard>
          );
        })}
      </div>

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
