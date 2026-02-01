import { AlertTriangle } from "lucide-react";

export default function WarningBox() {
  return (
    <div className="rounded border border-amber-900/50 bg-amber-950/10 p-4 flex items-start gap-4">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
      <div className="text-xs sm:text-sm font-mono text-amber-500/90 leading-relaxed">
        <p>
          This tool is for <strong className="font-bold text-amber-400">UK healthcare professionals</strong> to support infectious diseases risk assessment.
          It complements, but does not replace, clinical judgment or local/national guidance.
        </p>
        <p className="mt-3">
          <strong className="font-bold text-amber-400">Do not enter any private or patient-identifiable information. </strong>
          Always verify recommendations with your local infection team.
        </p>
      </div>
    </div>
  );
}
