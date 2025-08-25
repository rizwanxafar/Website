// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

import useSessionForm from "@/hooks/useSessionForm";
import useGovUkHcid from "@/hooks/useGovUkHcid";

import ScreeningStep from "./steps/ScreeningStep";
import SelectStep from "./steps/SelectStep";
import ReviewStep from "./steps/ReviewStep";
import ExposuresStep from "./steps/ExposuresStep"; // NEW

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

    // exposures
    exposuresGlobal, setExposuresGlobal,
    exposuresByCountry, setCountryExposure,

    // actions
    resetAll,
  } = useSessionForm();

  const { normalizedMap, meta, refresh } = useGovUkHcid();

  if (step === "screen") {
    return (
      <ScreeningStep
        q1Fever={q1Fever}
        setQ1Fever={setQ1Fever}
        q2Exposure={q2Exposure}
        setQ2Exposure={setQ2Exposure}
        onContinue={() => setStep("select")}
        onReset={resetAll}
      />
    );
  }

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

  if (step === "review") {
    return (
      <ReviewStep
        selected={selected}
        onset={onset}
        meta={meta}
        normalizedMap={normalizedMap}
        onBackToSelect={() => setStep("select")}
        onReset={resetAll}
        onContinueToExposures={() => setStep("exposures")} // NEW
      />
    );
  }

  // exposures
  return (
    <ExposuresStep
      selected={selected}
      normalizedMap={normalizedMap}
      exposuresGlobal={exposuresGlobal}
      setExposuresGlobal={setExposuresGlobal}
      exposuresByCountry={exposuresByCountry}
      setCountryExposure={setCountryExposure}
      onBackToReview={() => setStep("review")}
      onReset={resetAll}
    />
  );
}
