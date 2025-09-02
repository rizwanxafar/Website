// src/components/WarningBox.jsx
"use client";

export default function WarningBox() {
  return (
    <div className="mt-3 rounded-xl border-2 border-amber-300/70 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 p-4">
      <p className="font-semibold">Experimental tool — do not use for real patients</p>
      <p className="mt-1 text-sm">
        This is currently an experimental version of this tool. Do not use it for the risk assessment of
        actual patients. Do not enter any private or confidential patient information in any of the boxes.
        The responsibility for correct risk assessment lies with the user. Always consult official resources.
      </p>
    </div>
  );
}
