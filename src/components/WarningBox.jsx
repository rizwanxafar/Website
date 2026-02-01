import { AlertTriangle } from "lucide-react";

export default function WarningBox() {
  return (
    <div className="rounded border border-amber-900/50 bg-amber-950/10 p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">
          Clinical Warning
        </h3>
        <p className="text-sm font-mono text-amber-500/90 leading-relaxed">
          This tool is a decision aid only. If you suspect a Viral Haemorrhagic Fever (VHF), 
          immediately isolate the patient and contact the local Infectious Diseases team or 
          Virology consultant on call.
        </p>
      </div>
    </div>
  );
}
