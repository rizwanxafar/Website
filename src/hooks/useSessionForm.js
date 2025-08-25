// src/hooks/useSessionForm.js
// Centralises sessionStorage for screening + travel + exposures state

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "riskFormV1";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function useSessionForm() {
  // Steps: "screen" | "select" | "review" | "exposures"
  const [step, setStep] = useState("screen");

  // Screening
  const [q1Fever, setQ1Fever] = useState(""); // "yes" | "no" | ""
  const [q2Exposure, setQ2Exposure] = useState(""); // "yes" | "no" | ""

  // Travel
  const [selected, setSelected] = useState([]); // [{id,name,arrival,leaving}]
  const [onset, setOnset] = useState("");

  // UI helpers used by Select step
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const inputRef = useRef(null);

  // Exposures
  // Global Qs: outbreak + bleeding
  const [exposuresGlobal, setExposuresGlobal] = useState({
    q1_outbreak: "", // "yes" | "no" | ""
    q2_bleeding: "", // "yes" | "no" | ""
  });
  // Per-country exposures keyed by row id: { [rowId]: { lassa, ebola_marburg, cchf } }
  const [exposuresByCountry, setExposuresByCountry] = useState({});

  // Load once
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (parsed?.screening) {
        setQ1Fever(parsed.screening.q1Fever ?? "");
        setQ2Exposure(parsed.screening.q2Exposure ?? "");
        setStep(parsed.screening.step ?? "screen");
      }
      if (parsed?.selected) {
        const withIds = parsed.selected.map((c) => ({
          id: c.id || uid(),
          name: c.name,
          arrival: c.arrival || "",
          leaving: c.leaving || "",
        }));
        setSelected(withIds);
        setOnset(parsed.onset || "");
        if (withIds.length > 0) setShowInput(false);
      }
      if (parsed?.exposuresGlobal) {
        setExposuresGlobal({
          q1_outbreak: parsed.exposuresGlobal.q1_outbreak ?? "",
          q2_bleeding: parsed.exposuresGlobal.q2_bleeding ?? "",
        });
      }
      if (parsed?.exposuresByCountry) {
        setExposuresByCountry(parsed.exposuresByCountry || {});
      }
    } catch {}
  }, []);

  // Save on change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          screening: { q1Fever, q2Exposure, step },
          selected,
          onset,
          exposuresGlobal,
          exposuresByCountry,
        })
      );
    } catch {}
  }, [q1Fever, q2Exposure, step, selected, onset, exposuresGlobal, exposuresByCountry]);

  // Reset everything
  const resetAll = () => {
    setQ1Fever("");
    setQ2Exposure("");
    setStep("screen");
    setSelected([]);
    setOnset("");
    setQuery("");
    setOpen(false);
    setShowInput(true);
    setExposuresGlobal({ q1_outbreak: "", q2_bleeding: "" });
    setExposuresByCountry({});
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Helpers to update per-country exposures
  const setCountryExposure = (rowId, key, value) => {
    setExposuresByCountry((prev) => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [key]: value, // "yes" | "no" | ""
      },
    }));
  };

  return {
    // state
    step, setStep,
    q1Fever, setQ1Fever,
    q2Exposure, setQ2Exposure,
    selected, setSelected,
    onset, setOnset,

    // UI helpers (Select step)
    query, setQuery,
    open, setOpen,
    showInput, setShowInput,
    inputRef,

    // exposures
    exposuresGlobal, setExposuresGlobal,
    exposuresByCountry, setCountryExposure,

    // actions
    resetAll,
  };
}
