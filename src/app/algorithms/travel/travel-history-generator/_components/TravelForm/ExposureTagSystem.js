import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import SmoothReveal from '../ui/SmoothReveal';
import { EXPOSURE_CATEGORIES } from '../../_lib/constants';

const CATEGORY_HEADER = "text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-slate-200";
const TEXTAREA_STYLES = "w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[80px] resize-none font-sans placeholder:text-slate-400 transition-colors";
const LABEL_STYLES = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2";

const exposureCardClass = (isYes) => clsx(
  "flex items-center justify-between p-3 rounded-lg border transition-colors",
  isYes
    ? "bg-emerald-50 border-emerald-200"
    : "bg-white border-slate-200 hover:border-slate-300"
);

const toggleBtn = (active) => clsx(
  "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
  active
    ? "bg-slate-800 border-slate-800 text-white"
    : "bg-white border-slate-300 text-slate-500 hover:border-slate-400"
);

export default function ExposureTagSystem({ exposures, onChange }) {
  const setItem = (key, val) => onChange({ ...exposures, [key]: val });

  const markRestAsNo = () => {
    const patch = {};
    EXPOSURE_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        if ((exposures[item.key] || 'unknown') === 'unknown') patch[item.key] = 'no';
      });
    });
    onChange({ ...exposures, ...patch });
  };

  const hasPositive = EXPOSURE_CATEGORIES.some(cat =>
    cat.items.some(item => exposures[item.key] === 'yes' || exposures[item.key] === true)
  );

  return (
    <div className="space-y-8">

      {/* EXPOSURE GRID */}
      {EXPOSURE_CATEGORIES.map((cat) => (
        <div key={cat.title}>
          <div className={CATEGORY_HEADER}>{cat.title}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {cat.items.map((item) => {
              const status = exposures[item.key] || 'unknown';
              const isYes = status === 'yes' || status === true;
              const isNo = status === 'no' || status === false;

              return (
                <div key={item.key} className={exposureCardClass(isYes)}>
                  <span className={clsx(
                    "text-xs font-medium mr-2 truncate",
                    isYes ? "text-emerald-700" : "text-slate-600"
                  )} title={item.label}>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => setItem(item.key, 'yes')} className={toggleBtn(isYes)}>Yes</button>
                    <button type="button" onClick={() => setItem(item.key, 'no')} className={toggleBtn(isNo)}>No</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* MARK REMAINING */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={markRestAsNo}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          Mark Remaining as Negative
        </button>
      </div>

      {/* POSITIVE DETAILS */}
      <SmoothReveal show={hasPositive}>
        <div className="space-y-3 pt-5 border-t border-slate-200">
          <label className={LABEL_STYLES}>Positive Exposure Details</label>
          <textarea
            rows={3}
            className={TEXTAREA_STYLES}
            value={exposures.positiveDetails || ''}
            onChange={(e) => onChange({ ...exposures, positiveDetails: e.target.value })}
            placeholder="Describe the nature of the exposure(s) in detail..."
          />
        </div>
      </SmoothReveal>

      {/* OTHER NOTES */}
      <div className="border-t border-slate-200 pt-5">
        <label className={LABEL_STYLES}>Additional Clinical Notes</label>
        <textarea
          rows={2}
          className={TEXTAREA_STYLES}
          value={exposures.otherText}
          onChange={(e) => onChange({ ...exposures, otherText: e.target.value })}
          placeholder="Any other relevant trip details, hazards, or observations..."
        />
      </div>
    </div>
  );
}
