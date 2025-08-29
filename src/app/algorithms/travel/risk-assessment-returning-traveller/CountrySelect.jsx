"use client";

import React from "react";
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

  // --- exposures state (shared with Summary) ---
  const [exposuresGlobal, setExposuresGlobal] = React.useState({
    q1_outbreak: "", // yes|no|""
    q2_bleeding: "", // yes|no|""
  });
  const [exposuresByCountry, setExposuresByCountry] = React.useState({});
  const setCountryExposure = (rowId, key, value) => {
    setExposuresByCountry((prev) => ({
      ...prev,
      [rowId]: { ...(prev[rowId] || {}), [key]: value },
    }));
  };

  // Entry mode lets SummaryStep know if we came from Screening red
  // "normal" | "screeningRed"
  const [entryMode, setEntryMode] = React.useState("normal");

  const hardReset = () => {
    setExposuresByCountry({});
    setExposuresGlobal({ q1_outbreak: "", q2_bleeding: "" });
    setEntryMode("normal");
    resetAll();
  };

  if (step === "screen") {
    return (
      <ScreeningStep
        q1Fever={q1Fever}
        setQ1Fever={setQ1Fever}
        q2Exposure={q2Exposure}
        setQ2Exposure={setQ2Exposure}
        onContinue={() => { setEntryMode("normal"); setStep("select"); }}
        onReset={hardReset}
        // NEW: if screening goes red, jump straight to Summary pre-malaria flow
        onEscalateToSummary={() => { setEntryMode("screeningRed"); setStep("summary"); }}
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
        onBackToScreen={() => { setEntryMode("normal"); setStep("screen"); }}
        onReset={hardReset}
        onContinue={() => { setEntryMode("normal"); setStep("review"); }}
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
        onBackToSelect={() => { setEntryMode("normal"); setStep("select"); }}
        onReset={hardReset}
        onContinueToExposures={() => { setEntryMode("normal"); setStep("exposures"); }}
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
        onContinueToSummary={() => { setEntryMode("normal"); setStep("summary"); }}
      />
    );
  }

  // SUMMARY (also used for screening→red jump)
  return (
    <SummaryStep
      selected={selected}
      normalizedMap={normalizedMap}
      exposuresGlobal={exposuresGlobal}
      exposuresByCountry={exposuresByCountry}
      entryMode={entryMode}                            // <— tell Summary the entry path
      onBackToExposures={() => setStep("exposures")}
      onBackToScreen={() => setStep("screen")}         // <— used when came from screening
      onReset={hardReset}
    />
  );
}
