// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { vhfCountryNames } from "../../../data/vhfCountries";

export default function CountrySelect() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filtered suggestions (case-insensitive, starts-with or includes)
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vhfCountryNames;
    return vhfCountryNames.filter(
      (name) =>
        name.toLowerCase().startsWith(q) || name.toLowerCase().includes(q)
    );
  }, [query]);

  // Add current query if it exactly matches a country (or add a clicked suggestion)
  const addCountry = (nameRaw) => {
    const name = (nameRaw ?? query).trim();
    if (!name) return;
    const exists = vhfCountryNames.includes(name);
    if (!exists) return; // prevent adding names not in list
    if (selected.includes(name)) return; // prevent duplicates
    setSelected((prev) => [...prev, name]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeCountry = (name) => {
    setSelected((prev) => prev.filter((n) => n !== name));
  };

  // Keyboard: Enter to add first suggestion
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        addCountry(suggestions[0]);
      }
    } else if (e.key === "ArrowDown") {
      setOpen(true);
      // optional: focus list later
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        !inputRef.current?.closest(".country-select")?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Country / countries of travel
      </label>

      <div className="country-select relative">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Start typing a country…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="flex-1 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="country-suggestions"
          />
          <button
            type="button"
            onClick={() => addCountry()}
            className="shrink-0 rounded-lg border-2 border-slate-300 dark:border-slate-700 px-4 py-2 font-medium text-slate-900 dark:text-slate-100 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition"
            aria-label="Add country"
          >
            Add
          </button>
        </div>

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <ul
            id="country-suggestions"
            ref={listRef}
            className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg"
            role="listbox"
          >
            {suggestions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => addCountry(name)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  role="option"
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected countries */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 dark:border-slate-700 px-3 py-1 text-sm text-slate-900 dark:text-slate-100"
            >
              {name}
              <button
                type="button"
                className="rounded-md px-1.5 py-0.5 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400"
                aria-label={`Remove ${name}`}
                onClick={() => removeCountry(name)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Placeholder for next step button (disabled for now) */}
      <div className="pt-2">
        <button
          type="button"
          disabled
          className="rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-2 cursor-not-allowed"
          title="We’ll enable this once the next step is ready"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
