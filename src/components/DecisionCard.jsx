import { clsx } from "clsx";
import { AlertTriangle, CheckCircle, AlertOctagon, Info } from "lucide-react";

export default function DecisionCard({ tone = "green", title, children, className = "" }) {
  
  // --- THEME CONFIGURATION ---
  const styles = {
    // Critical / Danger (VHF High Risk)
    red: {
      container: "border-red-900/50 bg-red-950/10 shadow-[0_0_20px_rgba(220,38,38,0.1)]",
      icon: "text-red-500",
      title: "text-red-500",
      text: "text-red-400/80", 
      Icon: AlertOctagon
    },
    // Safe / Utility (Travel History / Low Risk)
    green: {
      container: "border-emerald-900/50 bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
      icon: "text-emerald-500",
      title: "text-emerald-500",
      text: "text-emerald-400/80",
      Icon: CheckCircle
    },
    // Warning / Privacy (Protocol Alerts)
    amber: {
      container: "border-amber-900/50 bg-amber-950/10",
      icon: "text-amber-500",
      title: "text-amber-500",
      text: "text-amber-400/80",
      Icon: AlertTriangle
    },
    // Fallback / Info
    gray: {
      container: "border-neutral-800 bg-neutral-900/50",
      icon: "text-neutral-400",
      title: "text-neutral-200",
      text: "text-neutral-400",
      Icon: Info
    }
  };

  const current = styles[tone] || styles.gray;
  const IconComponent = current.Icon;

  return (
    <div 
      className={clsx(
        "rounded-xl border p-5 transition-all duration-300", 
        current.container,
        className
      )}
      role="region"
      aria-label={title || "Decision"}
    >
      <div className="flex gap-4">
        <div className={clsx("shrink-0 mt-0.5", current.icon)}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          {title && (
            <h3 className={clsx("text-sm font-bold font-mono uppercase tracking-widest", current.title)}>
              {title}
            </h3>
          )}
          {children && (
            <div className={clsx("text-sm leading-relaxed font-sans", current.text)}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
