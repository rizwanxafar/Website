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

  // --- exposures state (lives here so SummaryStep can use it too) ---
  // Global exposure Qs
  const [exposuresGlobal, setExposuresGlobal] = React.useState({
    q1_outbreak: "", // yes|no|""
    q2_bleeding: "", // yes|no|""
  });

  // Per-country exposure answers
  const [exposuresByCountry, setExposuresByCountry] = React.useState({});
  const setCountryExposure = (rowId, key, value) => {
    setExposuresByCountry((prev) => ({
      ...prev,
      [rowId]: { ...(prev[rowId] || {}), [key]: value },
    }));
  };

  // Reset exposures when leaving review->screen etc. (included in resetAll already)
  const hardReset = () => {
    setExposuresByCountry({});
    setExposuresGlobal({ q1_outbreak: "", q2_bleeding: "" });
    resetAll();
  };

  if (step === "screen") {
    return (
      <ScreeningStep
        q1Fever={q1Fever}
        setQ1Fever={setQ1Fever}
        q2Exposure={q2Exposure}
        setQ2Exposure={setQ2Exposure}
        onContinue={() => setStep("select")}
        onReset={hardReset}
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
        onReset={hardReset}
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
        refresh={refresh}
        onBackToSelect={() => setStep("select")}
        onReset={hardReset}
        onContinueToExposures={() => setStep("exposures")}
      />
    );
  }

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
        onReset={hardReset}
        onContinueToSummary={() => setStep("summary")}
      />
    );
  }

  // new step
  return (
    <SummaryStep
      selected={selected}
      normalizedMap={normalizedMap}
      exposuresGlobal={exposuresGlobal}
      exposuresByCountry={exposuresByCountry}
      onBackToExposures={() => setStep("exposures")}
      onReset={hardReset}
    />
  );
}
