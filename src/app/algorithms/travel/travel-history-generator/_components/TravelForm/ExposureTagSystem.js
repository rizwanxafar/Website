import { clsx } from 'clsx';
import { Check, AlertCircle } from 'lucide-react'; 
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
  const CATEGORY_HEADER = "text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 pb-1 border-b border-slate-700";
  const CARD_BASE = "flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200";
  const CARD_DEFAULT = "bg-slate-800/40 border-slate-700 hover:bg-slate-700/50";
  const CARD_YES = "bg-emerald-500/10 border-emerald-500/50";
  
  const BTN_BASE = "px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border transition-colors min-w-[36px]";
  const BTN_YES_ACTIVE = "bg-emerald-600 border-emerald-600 text-white";
  const BTN_NO_ACTIVE = "bg-slate-700 border-slate-600 text-slate-300";
  const BTN_INACTIVE = "bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300";
  
  const TEXTAREA_STYLES = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 min-h-[80px] resize-none font-sans placeholder:text-slate-600";
  const LABEL_STYLES = "block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="space-y-8">
      
      {/* EXPOSURE GRID */}
      <div className="space-y-8">
        {EXPOSURE_CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <div className={CATEGORY_HEADER}>{cat.title}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.items.map((item) => {
                const status = exposures[item.key] || 'unknown';
                const isYes = status === 'yes' || status === true;
                const isNo = status === 'no' || status === false;

                return (
                  <div 
                    key={item.key} 
                    className={clsx(CARD_BASE, isYes ? CARD_YES : CARD_DEFAULT)}
                  >
                    <span className={clsx("text-xs font-medium mr-2 truncate", isYes ? "text-emerald-400" : "text-slate-400")} title={item.label}>
                      {item.label}
                    </span>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
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
      <div className="flex justify-end pt-2">
        <button 
          type="button" 
          onClick={markRestAsNo}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all uppercase tracking-wide"
        >
          <Check className="w-3 h-3" />
          Mark_Rest_Negative
        </button>
      </div>

      {/* POSITIVE DETAILS (Hidden until triggered) */}
      <SmoothReveal show={hasPositive}>
        <div className="space-y-3 pt-6 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-2">
             <AlertCircle className="w-4 h-4 text-emerald-500" />
             <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Positive Exposure Details</label>
          </div>
          <textarea 
            rows={3} 
            className={TEXTAREA_STYLES}
            value={exposures.positiveDetails || ''}
            onChange={(e) => onChange({ ...exposures, positiveDetails: e.target.value })} 
            placeholder="Describe the nature of the exposure(s)..."
          />
        </div>
      </SmoothReveal>

      {/* OTHER NOTES */}
      <div className="pt-6 border-t border-slate-700">
        <label className={LABEL_STYLES}>Additional Notes</label>
        <textarea 
          rows={2} 
          className={TEXTAREA_STYLES}
          value={exposures.otherText} 
          onChange={(e) => onChange({ ...exposures, otherText: e.target.value })} 
          placeholder="Any other relevant trip details..."
        />
      </div>
    </div>
  );
}
