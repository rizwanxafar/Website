import { clsx } from 'clsx';
import { Check } from 'lucide-react'; 
import SmoothReveal from '../ui/SmoothReveal';
import { EXPOSURE_CATEGORIES } from '../../_lib/constants';

export default function ExposureTagSystem({ exposures, onChange }) {
  const setItem = (key, val) => {
    onChange({ ...exposures, [key]: val });
  };

  const markRestAsNo = () => {
    const patch = {};
    EXPOSURE_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        const key = item.key;
        const current = exposures[key] || 'unknown';
        if (current === 'unknown') {
          patch[key] = 'no';
        }
      });
    });
    onChange({ ...exposures, ...patch });
  };

  const hasPositive = EXPOSURE_CATEGORIES.some(cat => 
    cat.items.some(item => exposures[item.key] === 'yes' || exposures[item.key] === true)
  );

  // --- STYLES ---
  const CATEGORY_HEADER = "text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-700";
  const CARD_BASE = "flex items-center justify-between p-3.5 rounded-lg border transition-all duration-200";
  const CARD_DEFAULT = "bg-slate-800/40 border-slate-700 hover:bg-slate-800/80";
  const CARD_YES = "bg-emerald-500/10 border-emerald-500/50 shadow-sm";
  
  const BTN_BASE = "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md border transition-colors min-w-[50px]";
  const BTN_YES_ACTIVE = "bg-emerald-600 border-emerald-600 text-white shadow-sm";
  const BTN_NO_ACTIVE = "bg-slate-700 border-slate-600 text-slate-300 shadow-sm";
  const BTN_INACTIVE = "bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300 hover:bg-slate-800";
  
  const TEXTAREA_STYLES = "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 min-h-[100px] resize-none font-sans placeholder:text-slate-500 transition-colors shadow-sm";
  const LABEL_STYLES = "block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3";

  return (
    <div className="space-y-10">
      
      {/* EXPOSURE GRID */}
      <div className="space-y-10">
        {EXPOSURE_CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <div className={CATEGORY_HEADER}>{cat.title}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.items.map((item) => {
                const status = exposures[item.key] || 'unknown';
                const isYes = status === 'yes' || status === true;
                const isNo = status === 'no' || status === false;

                return (
                  <div 
                    key={item.key} 
                    className={clsx(CARD_BASE, isYes ? CARD_YES : CARD_DEFAULT)}
                  >
                    <span className={clsx("text-sm font-medium mr-3 truncate", isYes ? "text-emerald-400" : "text-slate-300")} title={item.label}>
                      {item.label}
                    </span>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setItem(item.key, 'yes')}
                        className={clsx(BTN_BASE, isYes ? BTN_YES_ACTIVE : BTN_INACTIVE)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setItem(item.key, 'no')}
                        className={clsx(BTN_BASE, isNo ? BTN_NO_ACTIVE : BTN_INACTIVE)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* MARK REMAINING BUTTON */}
      <div className="flex justify-end pt-4">
        <button 
          type="button" 
          onClick={markRestAsNo}
          className="flex items-center gap-3 px-5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold font-mono text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all uppercase tracking-wide shadow-sm"
        >
          <Check className="w-4 h-4" />
          Mark Remaining as Negative
        </button>
      </div>

      {/* POSITIVE DETAILS (Hidden until triggered) */}
      <SmoothReveal show={hasPositive}>
        <div className="space-y-4 pt-8 border-t border-slate-700 mt-6">
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
      <div className="pt-8 border-t border-slate-700">
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
