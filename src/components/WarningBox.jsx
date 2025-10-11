// src/components/WarningBox.jsx
"use client";

export default function WarningBox() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
      <div className="text-lg leading-none mt-0.5">⚠️</div>
      <div>
        <p className="font-semibold mb-1">Clinical guidance</p>
        <p>
          This tool is for <strong>UK healthcare professionals</strong> to support infectious diseases risk assessment.
          It complements, but does not replace, clinical judgment or local/national guidance.
        </p>
        <p className="mt-2">
          <strong>Do not enter any private or patient-identifiable information. </strong>
          Always verify recommendations with your local infection team.
        </p>
      </div>
    </div>
  );
}
