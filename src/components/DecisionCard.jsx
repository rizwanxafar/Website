// src/components/DecisionCard.jsx
"use client";

export default function DecisionCard({
  tone = "green", // "green" | "amber" | "red"
  title,
  children,
  className = "",
}) {
  const styles = {
    green: {
      border: "border-emerald-300 dark:border-emerald-700",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      title: "text-emerald-800 dark:text-emerald-300",
    },
    amber: {
      border: "border-amber-300 dark:border-amber-700",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      title: "text-amber-800 dark:text-amber-300",
    },
    red: {
      border: "border-rose-300 dark:border-rose-700",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      title: "text-rose-800 dark:text-rose-300",
    },
  };

  const t = styles[tone] ?? styles.green;

  return (
    <div
      className={`rounded-xl border-2 ${t.border} ${t.bg} p-4 ${className}`}
      role="region"
      aria-label={title || "Decision"}
    >
      {title && (
        <div className={`font-semibold mb-2 ${t.title}`}>
          {title}
        </div>
      )}
      {children ? <div className="text-sm text-slate-800 dark:text-slate-200">{children}</div> : null}
    </div>
  );
}
