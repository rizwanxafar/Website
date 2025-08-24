// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { vhfCountryNames } from "@/data/vhfCountries";
import {
  todayISO,
  validateCountryRange,
  detectConflicts,
  sortSelected,
  daysSince,
} from "@/utils/travelDates";

const STORAGE_KEY = "riskFormV1";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/* -------------------- Reusable decision cards -------------------- */
function DecisionCard({ tone = "green", title, children }) {
  const classes =
    tone === "red"
      ? "border-rose-500 bg-rose-50/60 dark:border-rose-500 dark:bg-rose-900/20"
      : "border-emerald-500 bg-emerald-50/60 dark:border-emerald-500 dark:bg-emerald-900/20";
  return (
    <div className={`rounded-xl border-2 p-4 ${classes}`}>
      <div className="font-semibold mb-2">
        {title}
      </div>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  );
}

/* -------------------- Country name helpers (unchanged) -------------------- */
function normalizeName(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s'’`-]+/g, " ")
    .replace(/[()]/g, " ")
    .replace(/,+/g, " ")
    .replace(/\bthe\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Aliases to help matching
const ALIASES = {
  [normalizeName("Türkiye")]: "turkey",
  [normalizeName("Democratic Republic of the Congo")]: "congo democratic republic",
  [normalizeName("Congo (Democratic Republic)")]: "congo democratic republic",
  [normalizeName("DR Congo")]: "congo democratic republic",
  [normalizeName("Congo, Democratic Republic of the")]: "congo democratic republic",
  [normalizeName("Republic of the Congo")]: "congo republic",
  [normalizeName("Congo (Republic)")]: "congo republic",
  [normalizeName("Côte d’Ivoire")]: "cote divoire",
  [normalizeName("Cote d'Ivoire")]: "cote divoire",
  [normalizeName("Swaziland")]: "eswatini",
  [normalizeName("Eswatini")]: "eswatini",
};

function buildNormalizedMap(riskMap) {
  const out = new Map();
  if (!riskMap) return out;
  for (const [rawName, entries] of Object.entries(riskMap)) {
    const norm = normalizeName(rawName);
    out.set(norm, Array.isArray(entries) ? entries : []);
  }
  return out;
}

/** Returns array of {disease,evidence?,year?} | [] | null */
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

/* --------------------------------- Component --------------------------------- */
export default function CountrySelect() {
  // NEW: add a screening step before travel selection
  const [step, setStep] = useState("screen"); // "screen" | "select" | "review"

  // Screening answers: explicit "yes" | "no" | "" (unset)
  const [q1Fever, setQ1Fever] = useState(""); // Does the patient have an illness with a history of feverishness?
  const [q2Exposure, setQ2Exposure] = useState(""); // High-risk VHF exposure within 21 days?

  // Travel flow state (unchanged)
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const inputRef = useRef(null);

  const [selected, setSelected] = useState([]); // { id, name, arrival, leaving }
  const [onset, setOnset] = useState("");

  // Risk map & meta from API
  const [riskMap, setRiskMap] = useState(null);
  const [riskMeta, setRiskMeta] = useState({ source: "fallback", lastUpdatedText: null, snapshotDate: null });

  /* ---------- Load & persist (session) ---------- */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Screening
        if (parsed?.screening) {
          setQ1Fever(parsed.screening.q1Fever ?? "");
          setQ2Exposure(parsed.screening.q2Exposure ?? "");
          setStep(parsed.screening.step ?? "screen");
        }
        // Travel
        if (parsed?.selected) {
          const withIds = parsed.selected.map((c) => ({
            id: c.id || uid(),
            name: c.name,
            arrival: c.arrival || "",
            leaving: c.leaving || "",
          }));
          setSelected(withIds);
          setOnset(parsed.onset || "");
          if (withIds.length > 0) setShowInput(false);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          screening: { q1Fever, q2Exposure, step },
          selected,
          onset,
        })
      );
    } catch {}
  }, [q1Fever, q2Exposure, step, selected, onset]);

  const resetAll = () => {
    setQ1Fever("");
    setQ2Exposure("");
    setStep("screen");
    setSelected([]);
    setOnset("");
    setQuery("");
    setOpen(false);
    setShowInput(true);
    setRiskMap(null);
    setRiskMeta({ source: "fallback", lastUpdatedText: null, snapshotDate: null });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  /* -------------------- Suggestions & handlers -------------------- */
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vhfCountryNames;
    return vhfCountryNames.filter(
      (name) => name.toLowerCase().startsWith(q) || name.toLowerCase().includes(q)
    );
  }, [query]);

  const addCountry = (nameRaw) => {
    const name = (nameRaw ?? query).trim();
    if (!name) return;
    if (!vhfCountryNames.includes(name)) return;
    const exists = selected.some((c) => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      const ok = window.confirm(
        `${name} is already in the list. Add it again (e.g., for a second visit or layover)?`
      );
      if (!ok) return;
    }
    setSelected((prev) => [...prev, { id: uid(), name, arrival: "", leaving: "" }]);
    setQuery("");
    setOpen(false);
    setShowInput(false);
  };

  const removeCountry = (id) => setSelected((prev) => prev.filter((c) => c.id !== id));
  const updateDate = (id, field, value) =>
    setSelected((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) addCountry(suggestions[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      const root = document.querySelector(".country-select-root");
      if (root && !root.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  /* -------------------- Validity & conflicts -------------------- */
  const countryStatus = (c) => validateCountryRange(c.arrival, c.leaving, todayISO);
  const conflictIds = useMemo(() => detectConflicts(selected), [selected]);
  const sortedSelected = useMemo(() => sortSelected(selected), [selected]);

  const onsetValid = onset && onset <= todayISO;
  const canContinue =
    sortedSelected.length > 0 &&
    sortedSelected.every((c) => countryStatus(c) === "ok") &&
    conflictIds.size === 0 &&
    onsetValid;

  const arrivalMaxFor = (c) =>
    c.leaving ? (c.leaving < todayISO ? c.leaving : todayISO) : todayISO;
  const leavingMinFor = (c) => c.arrival || undefined;

  /* -------------------- Fetch GOV.UK map on Review -------------------- */
  useEffect(() => {
    if (step !== "review") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/hcid", { cache: "no-cache" });
        const data = await res.json();
        if (!cancelled) {
          setRiskMap(data?.map ?? {});
          setRiskMeta({
            source: data?.source || "fallback",
            lastUpdatedText: data?.lastUpdatedText || null,
            snapshotDate: data?.snapshotDate || null,
          });
        }
      } catch {
        if (!cancelled) {
          setRiskMap({});
          setRiskMeta({ source: "fallback", lastUpdatedText: null, snapshotDate: null });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step]);

  const normalizedRiskMap = useMemo(() => buildNormalizedMap(riskMap || {}), [riskMap]);

  /* ==================== STEP 0: SCREENING ==================== */
  if (step === "screen") {
    const q1Answered = q1Fever === "yes" || q1Fever === "no";
    const q2Available = q1Fever === "yes"; // per your rule: only ask Q2 if Q1 is yes
    const q2Answered = !q2Available || q2Exposure === "yes" || q2Exposure === "no";

    // End-state cards
    const showGreen = q1Fever === "no"; // Q1 No -> green, don't ask Q2
    const showRed = q1Fever === "yes" && q2Exposure === "yes"; // Q2 Yes -> red

    return (
      <div className="space-y-6">
        <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
          <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            Does the patient have an illness with a history of feverishness?
          </div>

          <div className="inline-flex overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setQ1Fever("yes")}
              className={`px-4 py-2 text-sm font-medium ${
                q1Fever === "yes"
                  ? "bg-violet-600 text-white"
                  : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => { setQ1Fever("no"); setQ2Exposure(""); }}
              className={`px-4 py-2 text-sm font-medium border-l-2 border-slate-300 dark:border-slate-700 ${
                q1Fever === "no"
                  ? "bg-violet-600 text-white"
                  : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
              }`}
            >
              No
            </button>
          </div>
        </div>

        {q2Available && (
          <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
            <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              Has the patient cared for / come into contact with body fluids of / handled clinical
              specimens from an individual or laboratory animal known or strongly suspected to have
              VHF within the past 21 days?
            </div>

            <div className="inline-flex overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setQ2Exposure("yes")}
                className={`px-4 py-2 text-sm font-medium ${
                  q2Exposure === "yes"
                    ? "bg-violet-600 text-white"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setQ2Exposure("no")}
                className={`px-4 py-2 text-sm font-medium border-l-2 border-slate-300 dark:border-slate-700 ${
                  q2Exposure === "no"
                    ? "bg-violet-600 text-white"
                    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
                }`}
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* Decision blocks */}
        {showGreen && (
          <DecisionCard tone="green" title="VHF unlikely; manage locally">
            <p>Please continue standard local management pathways.</p>
          </DecisionCard>
        )}

        {showRed && (
          <DecisionCard tone="red" title="AT RISK OF VHF">
            <ul className="list-disc pl-5">
              <li>ISOLATE PATIENT IN SIDE ROOM</li>
              <li>Discuss with infection consultant (Infectious Disease/Microbiology/Virology)</li>
              <li>Urgent malaria investigation</li>
              <li>Full blood count, U&amp;Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
              <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
            </ul>
          </DecisionCard>
        )}

        <div className="flex items-center gap-3">
          {/* Proceed only if Q1 yes & Q2 no */}
          <button
            type="button"
            onClick={() => setStep("select")}
            disabled={!(q1Fever === "yes" && q2Exposure === "no")}
            className={`rounded-lg px-4 py-2 ${
              q1Fever === "yes" && q2Exposure === "no"
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
            }`}
          >
            Continue to travel details
          </button>

          {/* Edit or Reset always available */}
          <button
            type="button"
            onClick={() => { setQ1Fever(""); setQ2Exposure(""); }}
            className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400"
          >
            Back / Edit answers
          </button>

          <button
            type="button"
            onClick={resetAll}
            className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
          >
            Reset assessment
          </button>
        </div>
      </div>
    );
  }

  /* ==================== STEP 1: SELECT (existing) ==================== */
  if (step === "select") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {sortedSelected.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {sortedSelected.map((c) => (
                <span
                  key={`chip-${c.id}`}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 dark:border-slate-700 px-3 py-1 text-sm text-slate-900 dark:text-slate-100"
                >
                  {c.name}
                  <button
                    type="button"
                    className="rounded-md px-1.5 py-0.5 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400"
                    aria-label={`Remove ${c.name}`}
                    onClick={() => removeCountry(c.id)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("screen")}
              className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium hover:border-violet-500 dark:hover:border-violet-400"
              title="Back to screening"
            >
              ← Screening
            </button>

            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
              title="Clear all countries and dates"
            >
              Reset assessment
            </button>
          </div>
        </div>

        {/* Add country input */}
        {!showInput && (
          <div>
            <button
              type="button"
              onClick={() => {
                setShowInput(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 px-4 py-2 font-medium text-slate-900 dark:text-slate-100 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition"
            >
              + Add country
            </button>
          </div>
        )}

        {showInput && (
          <div className="country-select-root relative">
           
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Start typing a country…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                className="flex-1 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls="country-suggestions"
                aria-label="Country / countries of travel"
              />
              <button
                type="button"
                onClick={() => addCountry()}
                className="shrink-0 rounded-lg border-2 border-slate-300 dark:border-slate-700 px-4 py-2 font-medium text-slate-900 dark:text-slate-100 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition"
                aria-label="Add country"
              >
                Add
              </button>
            </div>

            {open && suggestions.length > 0 && (
              <ul
                id="country-suggestions"
                className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg"
                role="listbox"
              >
                {suggestions.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => addCountry(name)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                      role="option"
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {sortedSelected.length > 0 && (
          <div className="space-y-4">
            {sortedSelected.map((c) => {
              const status = countryStatus(c);
              const hasConflict = detectConflicts(sortedSelected).has(c.id);
              const showWarn = status !== "ok" || hasConflict;

              let warnText = "";
              if (status === "invalid-range") warnText = "Leaving date must be the same as or after the arrival date.";
              else if (status === "incomplete") warnText = "Please choose both arrival and leaving dates.";
              else if (status === "future-date") warnText = "Dates cannot be in the future.";
              else if (hasConflict) warnText = "These dates overlap with another country. Adjust to avoid overlap.";

              const arrivalMax = c.leaving ? (c.leaving < todayISO ? c.leaving : todayISO) : todayISO;
              const leavingMin = c.arrival || undefined;

              return (
                <div
                  key={`card-${c.id}`}
                  className={`rounded-xl border-2 p-4 ${
                    hasConflict
                      ? "border-rose-500 bg-rose-50/40 dark:border-rose-500 dark:bg-rose-900/20"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  }`}
                >
                  <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {c.name} — travel dates
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                        Arrival date
                      </label>
                      <input
                        type="date"
                        value={c.arrival}
                        onChange={(e) => updateDate(c.id, "arrival", e.target.value)}
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
                        value={c.leaving}
                        onChange={(e) => updateDate(c.id, "leaving", e.target.value)}
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

                  {showWarn && (
                    <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">{warnText}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Symptom onset */}
        <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
          <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            Date of symptom onset
          </div>
          <div className="grid sm:grid-cols-[240px_1fr] gap-3 items-center">
            <input
              type="date"
              value={onset}
              onChange={(e) => setOnset(e.target.value)}
              className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
              max={todayISO}
            />
            {onset && (
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {onset > todayISO ? "Onset cannot be in the future." : `Days since onset: ${daysSince(onset)}`}
              </div>
            )}
          </div>
          {onset && onset > todayISO && (
            <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">Onset date cannot be in the future.</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep("review")}
            className={`rounded-lg px-4 py-2 ${
              canContinue
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
            }`}
            title={
              canContinue
                ? "Review country-specific risk"
                : "Ensure countries have valid, non-overlapping dates and symptom onset is set (not in the future)"
            }
          >
            Continue
          </button>

          <button
            type="button"
            onClick={resetAll}
            className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
            title="Clear all data"
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  /* ==================== STEP 2: REVIEW (existing) ==================== */
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

  const reviewList = sortSelected(selected).map((c) => {
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

    const entries = getEntriesForCountry(c.name, normalizedRiskMap);

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

    if (Array.isArray(entries) && entries.length === 0) {
      return {
        ...c,
        level: "green",
        header: "No UKHSA‑listed HCIDs",
        message: "GOV.UK indicates no specific HCID risk listed for this country.",
        entries: [],
      };
    }

    return {
      ...c,
      level: "red",
      header: "Consider the following HCIDs",
      message:
        "Within 21 days of travel from a country with UKHSA‑listed HCID occurrence.",
      entries,
    };
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Country‑specific risk review
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep("select")}
            className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium hover:border-violet-500 dark:hover:border-violet-400"
            title="Edit travel"
          >
            ← Edit travel
          </button>
          <button
            type="button"
            onClick={resetAll}
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
        {riskMeta.lastUpdatedText && (
          <span className="ml-1">
            · Last updated (GOV.UK):{" "}
            {new Date(riskMeta.lastUpdatedText).toLocaleDateString()}
          </span>
        )}
        {riskMeta.source === "snapshot-fallback" && (
          <span className="ml-1 text-amber-700 dark:text-amber-400">
            ⚠️ This page is using a cached copy of country risk data
            {riskMeta.snapshotDate ? ` (last updated ${riskMeta.snapshotDate})` : ""}.
            For patient care decisions, always verify with the current information on{" "}
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
