// src/components/DecisionCard.jsx
"use client";

export default function DecisionCard({ tone = "green", title, children }) {
  const classes =
    tone === "red"
      ? "border-rose-500 bg-rose-50/60 dark:border-rose-500 dark:bg-rose-900/20"
      : "border-emerald-500 bg-emerald-50/60 dark:border-emerald-500 dark:bg-emerald-900/20";

  return (
    <div className={`rounded-xl border-2 p-4 ${classes}`}>
      <div className="font-semibold mb-2">{title}</div>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  );
}
