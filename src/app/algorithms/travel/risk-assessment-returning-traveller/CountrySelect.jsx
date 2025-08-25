// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

// STEP COMPONENTS
import ScreeningStep from "./steps/ScreeningStep";
import TravelStep from "./steps/TravelStep";     // keep for now; you can inline later if you want
import ReviewStep from "./steps/ReviewStep";

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

// ------- Main component -------

export default function CountrySelect() {
  // ---- Flow state
  const [step, setStep] = useState(STEPS.SCREENING);

  // ---- Screening state (what ScreeningStep expects)
  const [q1Fever, setQ1Fever] = useState("");       // "yes" | "no" | ""
  const [q2Exposure, setQ2Exposure] = useState(""); // "yes" | "no" | ""

  // ---- Travel data
  const [selected, setSelected] = useState([]); // [{ id, name, arrival, leaving }]
  const [onset, setOnset] = useState("");      // "YYYY-MM-DD"

  // ---- HCID snapshot (from /api/hcid)
  const [riskMap, setRiskMap] = useState(null);
  const [hcidMeta, setHcidMeta] = useState(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapError, setMapError] = useState("");

  const refreshRiskMap = useCallback(async () => {
    try {
      setLoadingMap(true);
      setMapError("");
      const res = await fetch("/api/hcid", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRiskMap(json.map || {});
      setHcidMeta(json.meta || null);
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

  const normalizedRiskMap = useMemo(
    () => buildNormalizedMap(riskMap || {}),
    [riskMap]
  );

  // ---- Navigation
  const goToScreening = () => setStep(STEPS.SCREENING);
  const goToTravel   = () => setStep(STEPS.TRAVEL);
  const goToReview   = () => setStep(STEPS.REVIEW);

  const handleReset = () => {
    setQ1Fever("");
    setQ2Exposure("");
    setSelected([]);
    setOnset("");
    setStep(STEPS.SCREENING);
  };

  // ---- Render
  return (
    <div className="space-y-6">
      {/* (No inner H1 here to avoid duplicate with page.jsx) */}

      {/* Step content */}
      {step === STEPS.SCREENING && (
        <ScreeningStep
          q1Fever={q1Fever}
          setQ1Fever={setQ1Fever}
          q2Exposure={q2Exposure}
          setQ2Exposure={setQ2Exposure}
          onContinue={goToTravel}   // proceed only when Q1=yes and Q2=no
          onReset={handleReset}
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
        />
      )}

      {step === STEPS.REVIEW && (
        <ReviewStep
          selected={selected}
          onset={onset}
          meta={hcidMeta}
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
