// src/components/inputs/CountryInput.js
import { useId, useState, useEffect } from "react";
import { COUNTRY_SUGGESTIONS, resolveCountryName } from "@/data/countries";

export default function CountryInput({
  value,
  onChange,            // (val: string) => void
  placeholder = "Start typing…",
  className = "",
  id,
  label = "Country *",
}) {
  const reactId = useId();
  const listId = `${id || reactId}-countries`;
  const [local, setLocal] = useState(value || "");

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  const handleBlur = () => {
    const resolved = resolveCountryName(local);
    onChange?.(resolved);
    setLocal(resolved);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <input
        list={listId}
        type="text"
        placeholder={placeholder}
        className={
          "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm " +
          className
        }
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
      />
      <datalist id={listId}>
        {COUNTRY_SUGGESTIONS.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}
