import { Fragment } from 'react';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseDate, formatDMY } from '../../_lib/utils';

export default function ResponsiveDatePicker({ value, onChange }) {
  const dateObj = value ? parseDate(value) : undefined;

  const handleDaySelect = (d) => {
    if (!d) { onChange(''); return; }
    onChange(format(d, 'yyyy-MM-dd'));
  };

  const INPUT_STYLES = "w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand placeholder:text-slate-400 transition-colors flex items-center justify-between cursor-pointer hover:border-slate-400";
  const PANEL_BASE = "absolute z-50 mt-2 p-4 bg-white rounded-xl shadow-xl border border-slate-200 w-[300px]";

  return (
    <div className="relative w-full">
      {/* MOBILE: Native Input */}
      <div className="block md:hidden">
        <input
          type="date"
          className={INPUT_STYLES}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {/* DESKTOP: Custom Popover */}
      <div className="hidden md:block">
        <Popover className="relative w-full">
          <PopoverButton className={INPUT_STYLES}>
            <span className={clsx("block truncate", !value && "text-slate-400")}>
              {value ? formatDMY(value) : "Select date..."}
            </span>
            <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel className={PANEL_BASE}>
              {({ close }) => (
                <DayPicker
                  mode="single"
                  selected={dateObj}
                  onSelect={(d) => { handleDaySelect(d); close(); }}
                  showOutsideDays
                  classNames={{
                    months: "flex flex-col",
                    month: "space-y-3",
                    caption: "flex justify-center pt-1 relative items-center mb-2",
                    caption_label: "text-sm font-semibold text-slate-800",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent hover:bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 transition-colors",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse",
                    head_row: "flex",
                    head_cell: "text-slate-400 rounded-md w-9 font-normal text-[0.75rem] uppercase",
                    row: "flex w-full mt-1",
                    cell: "text-center text-sm relative p-0",
                    day: "h-9 w-9 p-0 font-normal text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",
                    day_selected: "!bg-brand !text-white font-semibold rounded-lg",
                    day_today: "text-brand font-semibold",
                    day_outside: "text-slate-300",
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
