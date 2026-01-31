import { clsx } from 'clsx';
import SmoothReveal from '../ui/SmoothReveal';
import { TEXTAREA_CLASS, EXPOSURE_CATEGORIES } from '../../_lib/constants';

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

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {EXPOSURE_CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">{cat.title}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.items.map((item) => {
                const status = exposures[item.key] || 'unknown';
                const isYes = status === 'yes' || status === true;
                const isNo = status === 'no' || status === false;

                return (
                  <div 
                    key={item.key} 
                    className="flex items-center justify-between p-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-all"
                  >
                    <span className="text-xs font-medium mr-2 truncate text-slate-700 dark:text-slate-300" title={item.label}>
                      {item.label}
                    </span>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setItem(item.key, 'yes')}
                        className={clsx(
                          "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors",
                          isYes 
                            ? "bg-[hsl(var(--brand))] text-white border-transparent" 
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                        )}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setItem(item.key, 'no')}
                        className={clsx(
                          "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors",
                          isNo 
                            ? "bg-slate-600 text-white border-transparent" 
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                        )}
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

      <div className="flex justify-end pt-2">
        <button 
          type="button" 
          onClick={markRestAsNo}
          className="text-xs font-medium text-[hsl(var(--brand))] hover:underline underline-offset-4 decoration-2"
        >
          Mark remaining as 'No'
        </button>
      </div>

      <SmoothReveal show={hasPositive}>
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">Kindly provide more detail about positive exposures</label>
          <textarea 
            rows={3} 
            className={TEXTAREA_CLASS}
            value={exposures.positiveDetails || ''}
            onChange={(e) => onChange({ ...exposures, positiveDetails: e.target.value })} 
          />
        </div>
      </SmoothReveal>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1 font-medium">Any other trip details or exposures</label>
        <textarea 
          rows={2} 
          className={TEXTAREA_CLASS}
          value={exposures.otherText} 
          onChange={(e) => onChange({ ...exposures, otherText: e.target.value })} 
        />
      </div>
    </div>
  );
}
