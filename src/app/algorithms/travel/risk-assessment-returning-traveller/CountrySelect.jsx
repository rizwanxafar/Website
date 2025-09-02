// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

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

  // --- SCREENING ---
  if (step === "screen") {
    return (
      <ScreeningStep
        q1Fever={q1Fever}
        setQ1Fever={setQ1Fever}
        q2Exposure={q2Exposure}
        setQ2Exposure={setQ2Exposure}
        onContinue={() => setStep("select")}
        onReset={resetAll}
        // If you support a direct jump to summary red from screening:
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
        onReset={resetAll}
        onContinue={() => setStep("review")}
      />
    );
  }

  // --- COUNTRY RISK REVIEW (GREEN/AMBER/RED SUMMARY PER COUNTRY) ---
  if (step === "review") {
    return (
      <ReviewStep
        selected={selected}
        onset={onset}
        meta={meta}
        normalizedMap={normalizedMap}
        refresh={refresh}
        onBackToSelect={() => setStep("select")}
        onReset={resetAll}
        // This was missing -> button did nothing
        onContinueToExposures={() => setStep("exposures")}
      />
    );
  }

  // --- EXPOSURE QUESTIONS (only for red countries) ---
  if (step === "exposures") {
    return (
      <ExposuresStep
        selected={selected}
        onset={onset}
        normalizedMap={normalizedMap}
        onBackToReview={() => setStep("review")}
        onContinueToSummary={() => setStep("summary")}
        onReset={resetAll}
      />
    );
  }

  // --- FINAL SUMMARY / NEXT STEPS ---
  return (
    <SummaryStep
      selected={selected}
      normalizedMap={normalizedMap}
      // If your SummaryStep needs these, keep them; otherwise harmless to pass:
      exposuresGlobal={{}}
      exposuresByCountry={{}}
      entryMode="normal"
      onBackToExposures={() => setStep("exposures")}
      onBackToScreen={() => setStep("screen")}
      onReset={resetAll}
    />
  );
}
