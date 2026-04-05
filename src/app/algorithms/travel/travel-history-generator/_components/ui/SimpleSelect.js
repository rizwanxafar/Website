import { Fragment } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { ChevronDown, Check } from 'lucide-react';

export default function SimpleSelect({ value, onChange, options = [], placeholder = 'Select...' }) {
  const getLabel = (opt) => (typeof opt === 'object' ? (opt.label || opt.name) : opt);
  const getValue = (opt) => (typeof opt === 'object' ? (opt.value || opt.id) : opt);

  const selectedOption = options.find(o => getValue(o) === value);
  const displayLabel = selectedOption ? getLabel(selectedOption) : (value || placeholder);

  const BTN_BASE = "relative w-full cursor-default rounded-lg border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 py-2.5 pl-3.5 pr-9 text-left text-sm text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors h-10";
  const DROPDOWN_BASE = "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1 text-sm shadow-lg focus:outline-none custom-scrollbar";

  return (
    <div className="relative w-full">
      <Listbox value={value} onChange={onChange}>
        <ListboxButton className={BTN_BASE}>
          <span className={clsx("block truncate", !selectedOption && !value && "text-slate-400 dark:text-slate-500")}>
            {displayLabel}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
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
                    clsx(
                      'relative cursor-pointer select-none py-2.5 pl-9 pr-4 border-b border-slate-100 dark:border-slate-800 last:border-0',
                      active ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                    )
                  }
                  value={optValue}
                >
                  {({ selected }) => (
                    <>
                      <span className={clsx('block truncate text-sm', selected ? 'font-semibold' : 'font-normal')}>
                        {label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand dark:text-brandAlt">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      )}
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
