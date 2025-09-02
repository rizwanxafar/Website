// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

import { useState } from "react";

import useSessionForm from "@/hooks/useSessionForm";
import useGovUkHcid from "@/hooks/useGovUkHcid";

import ScreeningStep from "./steps/ScreeningStep";
import SelectStep from "./steps/SelectStep";
import ReviewStep from "./steps/ReviewStep";
import ExposuresStep from "./steps/ExposuresStep";
import SummaryStep from "./steps/SummaryStep";

export default function CountrySelect() {
  const {
    // state
    step, setStep,
    q1Fever, setQ1Fever,
    q2Exposure, setQ2Exposure,
    selected, setSelected,
    onset, setOnset,
    // UI helpers (select step)
    query, setQuery,
    open, setOpen,
    showInput, setShowInput,
    inputRef,
    // actions
    resetAll,
  } = useSessionForm();

  const { normalizedMap, meta, refresh } = useGovUkHcid();

  // --- NEW: real exposure state kept locally in this component ---
  // Global exposures (asked outside specific countries)
  const [exposuresGlobal, setExposuresGlobal] = useState({
    q1_outbreak: "", // "yes" | "no" | ""
    q2_bleeding: "", // "yes" | "no" | ""
  });

  // Per-country exposures keyed by selected row id:
  // { [countryRowId]: { lassa?: "yes"|"no"|"", ebola_marburg?: "yes"|"no"|"", cchf?: "yes"|"no"|"" } }
  const [exposuresByCountry, setExposuresByCountry] = useState({});

  // Helper setter for child to update a single country's exposure answers
  const setCountryExposure = (countryId, patch) => {
    setExposuresByCountry((prev) => ({
      ...prev,
      [countryId]: { ...(prev[countryId] || {}), ...patch },
    }));
  };

  // Ensure a true full reset also clears exposure state
  const handleResetAll = () => {
    resetAll();
    setExposuresGlobal({ q1_outbreak: "", q2_bleeding: "" });
    setExposuresByCountry({});
  };

  // --- SCREENING ---
  if (step === "screen") {
    return (
      <ScreeningStep
        q1Fever={q1Fever}
        setQ1Fever={setQ1Fever}
        q2Exposure={q2Exposure}
        setQ2Exposure={setQ2Exposure}
        onContinue={() => setStep("select")}
        onReset={handleResetAll}
        // If you support a direct jump to summary red from screening, you can pass it here:
        // onEscalateToSummary={() => setStep("summary")}
      />
    );
  }

  // --- SELECT COUNTRIES/DATES ---
  if (step === "select") {
    return (
      <SelectStep
        selected={selected}
        setSelected={setSelected}
        onset={onset}
        setOnset={setOnset}
        query={query}
        setQuery={setQuery}
        open={open}
        setOpen={setOpen}
        showInput={showInput}
        setShowInput={setShowInput}
        inputRef={inputRef}
        onBackToScreen={() => setStep("screen")}
        onReset={handleResetAll}
        onContinue={() => setStep("review")}
      />
    );
  }

  // --- COUNTRY RISK REVIEW ---
  if (step === "review") {
    return (
      <ReviewStep
        selected={selected}
        onset={onset}
        meta={meta}
        normalizedMap={normalizedMap}
        refresh={refresh}
        onBackToSelect={() => setStep("select")}
        onReset={handleResetAll}
        onContinueToExposures={() => setStep("exposures")}
      />
    );
  }

  // --- EXPOSURE QUESTIONS ---
  if (step === "exposures") {
    return (
      <ExposuresStep
        selected={selected}
        normalizedMap={normalizedMap}
        exposuresGlobal={exposuresGlobal}
        setExposuresGlobal={setExposuresGlobal}
        exposuresByCountry={exposuresByCountry}
        setCountryExposure={setCountryExposure}
        onBackToReview={() => setStep("review")}
        onContinueToSummary={() => setStep("summary")}
        onReset={handleResetAll}
      />
    );
  }

  // --- FINAL SUMMARY / NEXT STEPS ---
  return (
    <SummaryStep
      selected={selected}
      normalizedMap={normalizedMap}
      exposuresGlobal={exposuresGlobal}
      exposuresByCountry={exposuresByCountry}
      entryMode="normal"
      onBackToExposures={() => setStep("exposures")}
      onBackToScreen={() => setStep("screen")}
      onReset={handleResetAll}
    />
  );
}
