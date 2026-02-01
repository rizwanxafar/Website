import { AlertTriangle } from "lucide-react";

export default function WarningBox() {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/10 p-4 flex items-start gap-4">
      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-red-500 uppercase tracking-wide font-mono">
          Clinical Warning
        </h3>
        <p className="text-sm text-red-400/80 leading-relaxed">
          This tool is a decision aid only. If you suspect a Viral Haemorrhagic Fever (VHF), 
          immediately isolate the patient and contact the local Infectious Diseases team or 
          Virology consultant on call. Do not delay urgent care while using this tool.
        </p>
      </div>
    </div>
  );
}
