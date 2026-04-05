import { AlertTriangle } from "lucide-react";

export default function WarningBox() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 dark:border-amber-900/50 dark:bg-amber-950/20">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
        <p>
          This tool is for <strong className="font-semibold text-amber-900 dark:text-amber-300">UK healthcare professionals</strong> to support infectious diseases risk assessment.
          It complements, but does not replace, clinical judgement or local/national guidance.
        </p>
        <p className="mt-2">
          <strong className="font-semibold text-amber-900 dark:text-amber-300">Do not enter any private or patient-identifiable information.</strong>{" "}
          Always verify recommendations with your local infection team.
        </p>
      </div>
    </div>
  );
}
