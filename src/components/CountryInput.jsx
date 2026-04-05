// src/components/CountryInput.jsx
"use client";

import { useEffect } from "react";
import { vhfCountryNames } from "@/data/vhfCountries";

export default function CountryInput({
  inputRef,
  query,
  setQuery,
  open,
  setOpen,
  onAdd,
}) {
  const suggestions = (() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return vhfCountryNames;
    return vhfCountryNames.filter(
      (name) => name.toLowerCase().startsWith(q) || name.toLowerCase().includes(q)
    );
  })();

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) onAdd?.(suggestions[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      const root = document.querySelector(".country-select-root");
      if (root && !root.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [setOpen]);

  return (
    <div className="country-select-root relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Start typing or select country…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="country-suggestions"
          aria-label="Country search"
        />
        <button
          type="button"
          onClick={() => onAdd?.()}
          className="shrink-0 rounded-lg border-2 border-slate-300 px-4 py-2 font-medium text-slate-900 hover:border-violet-500 hover:text-violet-700 hover:bg-violet-50 transition"
          aria-label="Add country"
        >
          Add
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id="country-suggestions"
          className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border-2 border-slate-300 bg-white shadow-lg"
          role="listbox"
        >
          {suggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => onAdd?.(name)}
                className="w-full text-left px-3 py-2 text-sm text-slate-900 hover:bg-violet-50"
                role="option"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
