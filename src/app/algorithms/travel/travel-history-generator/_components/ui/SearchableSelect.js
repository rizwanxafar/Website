import { useState, useMemo, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { normalize } from '../../_lib/utils';

export default function SearchableSelect({ value, onChange, options, placeholder, allowCustom = false }) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    // If options is undefined/null, default to empty array
    const safeOptions = options || [];
    
    // Normalize query
    const q = normalize(query);

    // If query is empty, return initial list (slice for perf)
    if (query === '') {
      return safeOptions.slice(0, 100);
    }

    // Filter
    return safeOptions.filter((opt) => {
      // Handle both string arrays and object arrays { name: ... }
      const str = typeof opt === 'string' ? opt : (opt?.name || '');
      return normalize(str).includes(q);
    }).slice(0, 100);
  }, [query, options]);

  // --- CLINICAL SAAS STYLES ---
  // Matches the h-12 / text-base standard
  const INPUT_CONTAINER = "relative w-full";
  const INPUT_STYLES = "w-full h-12 bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all shadow-sm";
  const DROPDOWN_BASE = "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-slate-950 border border-slate-800 py-1 text-base shadow-xl ring-1 ring-black/5 focus:outline-none sm:text-sm custom-scrollbar";

  return (
    <Combobox value={value} onChange={onChange} nullable>
      <div className={INPUT_CONTAINER}>
        <div className="relative">
          <ComboboxInput
            className={INPUT_STYLES}
            displayValue={(item) => item || ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-5 w-5 text-slate-500 hover:text-slate-300 transition-colors" aria-hidden="true" />
          </ComboboxButton>
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
              allowCustom ? (
                <ComboboxOption
                  className={({ active }) =>
                    clsx('relative cursor-pointer select-none py-3 pl-4 pr-4', active ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400')
                  }
                  value={query}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Add "{query}"</span>
                  </div>
                </ComboboxOption>
              ) : (
                <div className="relative cursor-default select-none px-4 py-3 text-slate-500 font-mono text-xs uppercase tracking-wider">No results found</div>
              )
            ) : (
              filteredOptions.map((opt, idx) => {
                const label = typeof opt === 'string' ? opt : opt.name;
                // Generate a stable key
                const key = typeof opt === 'string' ? `${opt}-${idx}` : `${opt.name}-${opt.id || idx}`;
                
                return (
                  <ComboboxOption
                    key={key}
                    className={({ active }) =>
                      clsx(
                        'relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors border-b border-slate-800/50 last:border-0', 
                        active ? 'bg-slate-800 text-emerald-400' : 'text-slate-300'
                      )
                    }
                    value={label}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={clsx('block truncate', selected ? 'font-bold text-emerald-400' : 'font-normal')}>
                          {label}
                        </span>
                        {selected ? (
                          <span className={clsx('absolute inset-y-0 left-0 flex items-center pl-3', active ? 'text-emerald-400' : 'text-emerald-500')}>
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ComboboxOption>
                );
              })
            )}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  );
}
