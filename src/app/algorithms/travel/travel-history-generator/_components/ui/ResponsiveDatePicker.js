import { Fragment } from 'react';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { Calendar, ChevronLeft, ChevronRight } from '../icons';
import { CONTAINER_BASE, INPUT_BASE } from '../../_lib/constants';
import { parseDate, formatDMY } from '../../_lib/utils';

export default function ResponsiveDatePicker({ value, onChange }) {
  const dateObj = value ? parseDate(value) : undefined;

  const handleDaySelect = (d) => {
    if (!d) { onChange(''); return; }
    onChange(format(d, 'yyyy-MM-dd'));
  };

  return (
    <div className="relative mt-1">
      {/* MOBILE: Native Input */}
      <div className="block md:hidden">
        <div className={CONTAINER_BASE}>
          <input
            type="date"
            className={INPUT_BASE}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>

      {/* DESKTOP: Custom Popover */}
      <div className="hidden md:block">
        <Popover className="relative w-full">
          <PopoverButton className={clsx(CONTAINER_BASE, "flex items-center justify-between text-left")}>
            <span className={clsx("block truncate py-2 pl-3", !value && "text-slate-400")}>
              {value ? formatDMY(value) : "Select date"}
            </span>
            <span className="pr-3 text-slate-400">
              <Calendar className="w-4 h-4" />
            </span>
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel className="absolute z-50 mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-[300px]">
              {({ close }) => (
                <DayPicker
                  mode="single"
                  selected={dateObj}
                  onSelect={(d) => { handleDaySelect(d); close(); }}
                  showOutsideDays
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium text-slate-900 dark:text-slate-100",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md flex items-center justify-center text-slate-500 transition",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm relative p-0 focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100",
                    day_selected: "!bg-[hsl(var(--brand))] !text-white hover:!bg-[hsl(var(--brand))]/90",
                    day_today: "bg-slate-100 dark:bg-slate-800 font-bold text-[hsl(var(--brand))]",
                  }}
                  components={{
                    IconLeft: () => <ChevronLeft className="w-4 h-4" />,
                    IconRight: () => <ChevronRight className="w-4 h-4" />,
                  }}
                />
              )}
            </PopoverPanel>
          </Transition>
        </Popover>
      </div>
    </div>
  );
}
