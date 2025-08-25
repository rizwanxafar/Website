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

  // IMPORTANT: we now also take the raw `map` so SelectStep can build the country list.
  const { map, normalizedMap, meta, refresh } = useGovUkHcid();

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
        // data
        map={map}
        selected={selected}
        setSelected={setSelected}
        onset={onset}
        setOnset={setOnset}
        // UI helpers
        query={query}
        setQuery={setQuery}
        open={open}
        setOpen={setOpen}
        showInput={showInput}
        setShowInput={setShowInput}
        inputRef={inputRef}
        // nav
        onBackToScreen={() => setStep("screen")}
        onReset={resetAll}
        onContinue={() => setStep("review")}
      />
    );
  }

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
