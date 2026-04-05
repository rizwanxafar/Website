import { AlertTriangle } from "lucide-react";

export default function WarningBox() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800 leading-relaxed">
        <p>
          This tool is for <strong className="font-semibold text-amber-900">UK healthcare professionals</strong> to support infectious diseases risk assessment.
          It complements, but does not replace, clinical judgement or local/national guidance.
        </p>
        <p className="mt-2">
          <strong className="font-semibold text-amber-900">Do not enter any private or patient-identifiable information.</strong>{" "}
          Always verify recommendations with your local infection team.
        </p>
      </div>
    </div>
  );
}
