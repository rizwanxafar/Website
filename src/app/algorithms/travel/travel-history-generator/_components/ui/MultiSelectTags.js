import { useState, useMemo, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { X, Plus } from 'lucide-react';
import { normalize } from '../../_lib/utils';

export default function MultiSelectTags({ value = [], onChange, options, placeholder }) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const q = normalize(query);
    return query === ''
      ? options.filter(opt => !value.includes(opt))
      : options.filter(opt => normalize(opt).includes(q) && !value.includes(opt));
  }, [query, options, value]);

  const removeTag = (tag) => onChange(value.filter(t => t !== tag));
  const addTag = (tag) => { if (!tag) return; if (!value.includes(tag)) onChange([...value, tag]); setQuery(''); };

  const CONTAINER = "flex flex-wrap items-center gap-1.5 p-2 min-h-[40px] w-full bg-white border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand transition-colors";
  const DROPDOWN_BASE = "absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg bg-white border border-slate-200 py-1 text-sm shadow-lg focus:outline-none custom-scrollbar";
  const TAG_BASE = "inline-flex items-center gap-1 rounded-md bg-brand/10 border border-brand/20 px-2 py-0.5 text-xs font-semibold text-brand";
  const INPUT_STYLES = "min-w-[120px] flex-1 border-none bg-transparent py-1 px-1 text-sm text-slate-900 focus:ring-0 placeholder:text-slate-400";

  return (
    <Combobox value={null} onChange={addTag} nullable>
      <div className="relative w-full">
        <div className={CONTAINER}>
          {value.map((tag) => (
            <span key={tag} className={TAG_BASE}>
              {tag}
              <button
                type="button"
                className="ml-0.5 rounded-sm hover:opacity-70 transition-opacity"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <ComboboxInput
            className={INPUT_STYLES}
            displayValue={() => query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={value.length === 0 ? placeholder : ""}
          />
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <ComboboxOptions className={DROPDOWN_BASE}>
            {filteredOptions.length === 0 && query !== '' ? (
              <ComboboxOption
                className={({ active }) =>
                  clsx('cursor-pointer select-none py-2.5 pl-3.5 pr-4', active ? 'bg-slate-100 text-brand' : 'text-slate-600')
                }
                value={query}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="font-medium text-xs">Add &quot;{query}&quot;</span>
                </div>
              </ComboboxOption>
            ) : (
              filteredOptions.map((opt, idx) => (
                <ComboboxOption
                  key={idx}
                  className={({ active }) =>
                    clsx('cursor-pointer select-none py-2.5 pl-3.5 pr-4 border-b border-slate-100 last:border-0',
                      active ? 'bg-slate-100 text-slate-900' : 'text-slate-700')
                  }
                  value={opt}
                >
                  <span className="block truncate text-sm font-medium">{opt}</span>
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  );
}
