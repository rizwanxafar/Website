import { clsx } from "clsx";
import { AlertTriangle, CheckCircle, AlertOctagon, Info } from "lucide-react";

export default function DecisionCard({ tone = "green", title, children, className = "" }) {

  const styles = {
    red: {
      container: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20",
      icon: "text-red-600 dark:text-red-500",
      title: "text-red-700 dark:text-red-400",
      text: "text-red-700 dark:text-red-400",
      Icon: AlertOctagon,
    },
    green: {
      container: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
      icon: "text-emerald-600 dark:text-emerald-500",
      title: "text-emerald-700 dark:text-emerald-400",
      text: "text-emerald-700 dark:text-emerald-400",
      Icon: CheckCircle,
    },
    amber: {
      container: "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20",
      icon: "text-amber-600 dark:text-amber-500",
      title: "text-amber-700 dark:text-amber-400",
      text: "text-amber-700 dark:text-amber-400",
      Icon: AlertTriangle,
    },
    gray: {
      container: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50",
      icon: "text-slate-500 dark:text-slate-400",
      title: "text-slate-700 dark:text-slate-300",
      text: "text-slate-600 dark:text-slate-400",
      Icon: Info,
    },
  };

  const current = styles[tone] || styles.gray;
  const IconComponent = current.Icon;

  return (
    <div
      className={clsx("rounded-xl border p-5 transition-all", current.container, className)}
      role="region"
      aria-label={title || "Decision"}
    >
      <div className="flex gap-3">
        <div className={clsx("shrink-0 mt-0.5", current.icon)}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          {title && (
            <h3 className={clsx("text-sm font-bold uppercase tracking-wide", current.title)}>
              {title}
            </h3>
          )}
          {children && (
            <div className={clsx("text-sm leading-relaxed", current.text)}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
