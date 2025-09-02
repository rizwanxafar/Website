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

  // -------- exposures state (local here) --------
  const [exposuresGlobal, setExposuresGlobal] = useState({
    q1_outbreak: "", // "yes" | "no" | ""
    q2_bleeding: "", // "yes" | "no" | ""
  });

  // { [countryRowId]: { lassa?: "yes"|"no"|"", ebola_marburg?: "yes"|"no"|"", cchf?: "yes"|"no"|"" } }
  const [exposuresByCountry, setExposuresByCountry] = useState({});

  // Support BOTH call styles:
  //   setCountryExposure(id, "lassa", "yes")
  //   setCountryExposure(id, { lassa: "yes" })
  const setCountryExposure = (countryId, arg2, arg3) => {
    setExposuresByCountry((prev) => {
      const prevRow = prev[countryId] || {};
      if (typeof arg2 === "string" && typeof arg3 === "string") {
        // key/value form
        return { ...prev, [countryId]: { ...prevRow, [arg2]: arg3 } };
      }
      if (arg2 && typeof arg2 === "object") {
        // patch object form
        return { ...prev, [countryId]: { ...prevRow, ...arg2 } };
      }
      // nothing to change
      return prev;
    });
  };

  const handleResetAll = () => {
    resetAll();
    setExposuresGlobal({ q1_outbreak: "", q2_bleeding: "" });
    setExposuresByCountry({});
  };

  // -------- steps --------
  if (step === "screen") {
    return (
      <ScreeningStep
        q1Fever={q1Fever}
        setQ1Fever={setQ1Fever}
        q2Exposure={q2Exposure}
        setQ2Exposure={setQ2Exposure}
        onContinue={() => setStep("select")}
        onReset={handleResetAll}
        // onEscalateToSummary={() => setStep("summary")} // if used
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
        onReset={handleResetAll}
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
        onReset={handleResetAll}
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
        onContinueToSummary={() => setStep("summary")}
        onReset={handleResetAll}
      />
    );
  }

  // summary
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
