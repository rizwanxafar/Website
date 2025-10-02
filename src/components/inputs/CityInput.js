// src/components/inputs/CityInput.jsx
"use client";

import { useEffect } from "react";

export default function CityInput({
  inputRef,
  query,
  setQuery,
  open,
  setOpen,
  names = [],
  placeholder = "Start typing or select city…",
  onAdd,
}) {
  const suggestions = (() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return names;
    return names.filter(
      (name) =>
        name.toLowerCase().startsWith(q) || name.toLowerCase().includes(q)
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
      const root = document.querySelector(".city-select-root");
      if (root && !root.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [setOpen]);

  return (
    <div className="city-select-root relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
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
          aria-controls="city-suggestions"
          aria-label="City search"
        />
        <button
          type="button"
          onClick={() => onAdd?.()}
          className="shrink-0 rounded-lg border-2 border-slate-300 dark:border-slate-700 px-4 py-2 font-medium text-slate-900 dark:text-slate-100 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition"
          aria-label="Add city"
        >
          Add
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id="city-suggestions"
          className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg"
          role="listbox"
        >
          {suggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => onAdd?.(name)}
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
  );
}
