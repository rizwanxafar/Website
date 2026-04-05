import { useState, useMemo, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { normalize } from '../../_lib/utils';

export default function SearchableSelect({ value, onChange, options, placeholder, allowCustom = false }) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const safeOptions = options || [];
    const q = normalize(query);
    if (query === '') return safeOptions.slice(0, 100);
    return safeOptions.filter((opt) => {
      const str = typeof opt === 'string' ? opt : (opt?.name || '');
      return normalize(str).includes(q);
    }).slice(0, 100);
  }, [query, options]);

  const INPUT_STYLES = "w-full h-10 bg-white border border-slate-300 rounded-lg pl-3.5 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors";
  const DROPDOWN_BASE = "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white border border-slate-200 py-1 text-sm shadow-lg focus:outline-none custom-scrollbar";

  return (
    <Combobox value={value} onChange={onChange} nullable>
      <div className="relative w-full">
        <ComboboxInput
          className={INPUT_STYLES}
          displayValue={(item) => item || ''}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </ComboboxButton>

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
                <div className="px-3.5 py-2.5 text-xs text-slate-400">No results found</div>
              )
            ) : (
              filteredOptions.map((opt, idx) => {
                const label = typeof opt === 'string' ? opt : opt.name;
                const key = typeof opt === 'string' ? `${opt}-${idx}` : `${opt.name}-${opt.id || idx}`;
                return (
                  <ComboboxOption
                    key={key}
                    className={({ active }) =>
                      clsx(
                        'relative cursor-pointer select-none py-2.5 pl-9 pr-4 border-b border-slate-100 last:border-0',
                        active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                      )
                    }
                    value={label}
                  >
                    {({ selected }) => (
                      <>
                        <span className={clsx('block truncate text-sm', selected ? 'font-semibold' : 'font-normal')}>
                          {label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        )}
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
