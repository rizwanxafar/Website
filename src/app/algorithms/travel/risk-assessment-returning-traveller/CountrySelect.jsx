"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion"; // 1. Import Motion

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

  // Exposures state
  const [exposuresGlobal, setExposuresGlobal] = useState({
    q1_outbreak: "",
    q2_bleeding: "",
  });

  const [exposuresByCountry, setExposuresByCountry] = useState({});

  const setCountryExposure = (countryId, arg2, arg3) => {
    setExposuresByCountry((prev) => {
      const prevRow = prev[countryId] || {};
      if (typeof arg2 === "string" && typeof arg3 === "string") {
        return { ...prev, [countryId]: { ...prevRow, [arg2]: arg3 } };
      }
      if (arg2 && typeof arg2 === "object") {
        return { ...prev, [countryId]: { ...prevRow, ...arg2 } };
      }
      return prev;
    });
  };

  const [summaryEntry, setSummaryEntry] = useState("normal");

  const handleResetAll = () => {
    resetAll();
    setExposuresGlobal({ q1_outbreak: "", q2_bleeding: "" });
    setExposuresByCountry({});
    setSummaryEntry("normal");
  };

  // 2. Animation Variants (Slide Left/Right feeling)
  const variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  // 3. Render Helper to wrap steps in Motion
  const renderStep = () => {
    if (step === "screen") {
      return (
        <ScreeningStep
          key="screen"
          q1Fever={q1Fever}
          setQ1Fever={setQ1Fever}
          q2Exposure={q2Exposure}
          setQ2Exposure={setQ2Exposure}
          onContinue={() => { setSummaryEntry("normal"); setStep("select"); }}
          onReset={handleResetAll}
          onEscalateToSummary={() => { setSummaryEntry("screeningRed"); setStep("summary"); }}
        />
      );
    }

    if (step === "select") {
      return (
        <SelectStep
          key="select"
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
          key="review"
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
          key="exposures"
          selected={selected}
          normalizedMap={normalizedMap}
          exposuresGlobal={exposuresGlobal}
          setExposuresGlobal={setExposuresGlobal}
          exposuresByCountry={exposuresByCountry}
          setCountryExposure={setCountryExposure}
          onBackToReview={() => setStep("review")}
          onContinueToSummary={() => { setSummaryEntry("normal"); setStep("summary"); }}
          onReset={handleResetAll}
        />
      );
    }

    return (
      <SummaryStep
        key="summary"
        selected={selected}
        normalizedMap={normalizedMap}
        exposuresGlobal={exposuresGlobal}
        exposuresByCountry={exposuresByCountry}
        entryMode={summaryEntry}
        onBackToExposures={() => setStep("exposures")}
        onBackToScreen={() => setStep("screen")}
        onReset={handleResetAll}
      />
    );
  };

  return (
    // 4. AnimatePresence handles the exit animations
    <AnimatePresence mode="wait">
      <motion.div
        key={step} // Key triggers the animation when step changes
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {renderStep()}
      </motion.div>
    </AnimatePresence>
  );
}
