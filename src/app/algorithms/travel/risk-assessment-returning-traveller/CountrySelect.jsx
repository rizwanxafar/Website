// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

// STEP COMPONENTS (these should already exist in your repo)
import ScreeningStep from "./steps/ScreeningStep";
import TravelStep from "./steps/TravelStep";
import ReviewStep from "./steps/ReviewStep";

// If you already have a normalize utility, keep this import.
// Otherwise this local fallback just lowercases and trims.
import { normalizeName as externalNormalizeName } from "@/utils/names";

// ------- Small helpers -------

const STEPS = {
  SCREENING: 0,
  TRAVEL: 1,
  REVIEW: 2,
};

function normalizeName(s) {
  if (typeof externalNormalizeName === "function") return externalNormalizeName(s);
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a Map<normalizedCountryName, entries[]> from the plain HCID object */
function buildNormalizedMap(riskObj) {
  const m = new Map();
  if (!riskObj || typeof riskObj !== "object") return m;
  for (const [country, entries] of Object.entries(riskObj)) {
    const key = normalizeName(country);
    m.set(key, Array.isArray(entries) ? entries : []);
  }
  return m;
}

/** Generate a simple id for a selected travel row */
function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

// ------- Main component -------

export default function CountrySelect() {
  // Flow state
  const [step, setStep] = useState(STEPS.SCREENING);

  // Travel data
  const [selected, setSelected] = useState([]); // [{ id, name, arrival, leaving }]
  const [onset, setOnset] = useState(""); // "YYYY-MM-DD"

  // HCID data (from /api/hcid) — NEW: store meta as well
  const [riskMap, setRiskMap] = useState(null);
  const [hcidMeta, setHcidMeta] = useState(null); // <-- NEW
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapError, setMapError] = useState("");

  // Fetch the snapshot-only HCID once (and allow manual refresh)
  const refreshRiskMap = useCallback(async () => {
    try {
      setLoadingMap(true);
      setMapError("");
      const res = await fetch("/api/hcid", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRiskMap(json.map || {});
      setHcidMeta(json.meta || null); // <-- capture meta
    } catch (e) {
      setMapError("Could not load HCID country risk data.");
      setRiskMap({});
      setHcidMeta(null);
    } finally {
      setLoadingMap(false);
    }
  }, []);

  useEffect(() => {
    refreshRiskMap();
  }, [refreshRiskMap]);

  // Normalized map for fast lookups
  const normalizedRiskMap = useMemo(
    () => buildNormalizedMap(riskMap || {}),
    [riskMap]
  );

  // Navigation handlers
  const goToScreening = () => setStep(STEPS.SCREENING);
  const goToTravel = () => setStep(STEPS.TRAVEL);
  const goToReview = () => setStep(STEPS.REVIEW);

  const handleReset = () => {
    setSelected([]);
    setOnset("");
    setStep(STEPS.SCREENING);
  };

  // Render
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          VHF Risk Assessment — Returning Traveller
        </h1>

        <div className="flex items-center gap-2">
          {step > STEPS.SCREENING && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
              title="Start a new assessment"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Step content */}
      {step === STEPS.SCREENING && (
        <ScreeningStep
          // Your ScreeningStep should call onPass() when Q1=yes and Q2=no
          onPass={goToTravel}
          // If Q1 = no, your ScreeningStep should show the reusable green “VHF unlikely” block.
          // If Q2 = yes, your ScreeningStep should show the reusable red “AT RISK OF VHF” block.
        />
      )}

      {step === STEPS.TRAVEL && (
        <TravelStep
          selected={selected}
          setSelected={setSelected}
          onset={onset}
          setOnset={setOnset}
          onBack={goToScreening}
          onNext={goToReview}
          // Optional extras your existing TravelStep might accept:
          // allowSameDayTouch=true, etc.
        />
      )}

      {step === STEPS.REVIEW && (
        <ReviewStep
          selected={selected}
          onset={onset}
          meta={hcidMeta}               // <-- PASS META HERE (NEW)
          normalizedMap={normalizedRiskMap}
          refresh={refreshRiskMap}
          onBackToSelect={goToTravel}
          onReset={handleReset}
        />
      )}

      {/* Tiny loader / error line for HCID fetch (optional) */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {loadingMap && "Loading country risk data…"}
        {!loadingMap && mapError && (
          <span className="text-amber-700 dark:text-amber-400">{mapError}</span>
        )}
      </div>
    </div>
  );
}
