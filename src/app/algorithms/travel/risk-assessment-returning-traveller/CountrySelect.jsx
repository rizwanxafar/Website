// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

import useSessionForm from "@/hooks/useSessionForm";
import useGovUkHcid from "@/hooks/useGovUkHcid";

import ScreeningStep from "./steps/ScreeningStep";
import SelectStep from "./steps/SelectStep";
import ReviewStep from "./steps/ReviewStep";

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

  if (step === "screen") {
    return (
      <ScreeningStep
        q1Fever={q1Fever}
        setQ1Fever={setQ1Fever}
        q2Exposure={q2Exposure}
        setQ2Exposure={setQ2Exposure}
        onContinue={() => setStep("select")}
        onReset={resetAll}
        // If you have an "escalate to summary" jump, pass it here (uncomment if used):
        // onEscalateToSummary={() => setStep("review")} // or a dedicated "summary" step in your app
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

  // Default: review/summary step
  return (
    <ReviewStep
      selected={selected}
      onset={onset}
      meta={meta}
      normalizedMap={normalizedMap}
      refresh={refresh}
      onBackToSelect={() => setStep("select")}
      onReset={resetAll}
    />
  );
}
