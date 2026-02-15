import { Fragment } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { ChevronDown, Check } from 'lucide-react';

export default function SimpleSelect({ value, onChange, options = [], placeholder = 'Select...' }) {
  
  // Helper: Handle both ["Option A"] and [{label: "Option A", value: "a"}]
  const getLabel = (opt) => (typeof opt === 'object' ? (opt.label || opt.name) : opt);
  const getValue = (opt) => (typeof opt === 'object' ? (opt.value || opt.id) : opt);

  // Find the label for the currently selected value
  const selectedOption = options.find(o => getValue(o) === value);
  const displayLabel = selectedOption ? getLabel(selectedOption) : (value || placeholder);

  // --- CLINICAL SAAS STYLES ---
  // H-12 (48px) and Text-Base (16px)
  const BTN_BASE = "relative w-full cursor-default rounded-lg border bg-slate-900 py-3 pl-4 pr-10 text-left text-base shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors h-12";
  const BTN_COLOR = "border-slate-700 text-white";
  const BTN_PLACEHOLDER = "text-slate-500";
  
  const DROPDOWN_BASE = "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-slate-950 border border-slate-800 py-1 text-base shadow-xl ring-1 ring-black/5 focus:outline-none sm:text-sm custom-scrollbar";
  
  const OPTION_BASE = "relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors border-b border-slate-800/50 last:border-0";
  const OPTION_ACTIVE = "bg-slate-800 text-emerald-400";
  const OPTION_INACTIVE = "text-slate-300";

  return (
    <div className="relative w-full">
      <Listbox value={value} onChange={onChange}>
        <ListboxButton className={clsx(BTN_BASE, BTN_COLOR)}>
          <span className={clsx("block truncate", !selectedOption && !value && BTN_PLACEHOLDER)}>
            {displayLabel}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </span>
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className={DROPDOWN_BASE}>
            {options.map((opt, idx) => {
              const label = getLabel(opt);
              const optValue = getValue(opt);
              return (
                <ListboxOption
                  key={idx}
                  className={({ active }) =>
                    clsx(OPTION_BASE, active ? OPTION_ACTIVE : OPTION_INACTIVE)
                  }
                  value={optValue}
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
                </ListboxOption>
              );
            })}
          </ListboxOptions>
        </Transition>
      </Listbox>
    </div>
  );
}
