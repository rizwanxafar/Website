"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// If you already have shared components, import them here:
// import AlgorithmLayout from "@/components/AlgorithmLayout";
// import DecisionCard from "@/components/DecisionCard";

const Section = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <label className="block mb-3">
    <span className="block text-sm font-medium mb-1">{label}</span>
    {children}
  </label>
);

function number(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }

function buildRecommendation(d) {
  const notes = [];
  const actions = [];
  const warn = [];

  // Red flags
  if (d.decomp === "yes") {
    warn.push("Decompensated liver disease. Urgent hepatology referral.");
  }

  // Cirrhosis rule
  if (d.cirrhosis === "yes") {
    actions.push("Start antiviral therapy regardless of HBV DNA or ALT (entecavir or tenofovir disoproxil).");
  }

  // Fibrosis/necrosis rule
  const dna = number(d.hbvdna);
  const alt = number(d.alt);
  const hasFibrosis = d.fibrosisStage && d.fibrosisStage !== "none";
  if (dna !== null && dna > 2000 && hasFibrosis) {
    actions.push("Consider antiviral therapy (HBV DNA > 2000 IU/mL with necroinflammation/fibrosis).");
  }

  // Immunosuppression prophylaxis
  if (d.ims === "yes") {
    if (dna !== null && dna > 2000) {
      actions.push("Immunosuppression: give prophylaxis with entecavir or tenofovir disoproxil.");
    } else {
      actions.push("Immunosuppression: offer prophylaxis; if <6 months consider lamivudine with monthly HBV DNA and switch to TDF if DNA detectable at 3 months; if ≥6 months use entecavir or TDF.");
    }
  }

  // Pregnancy
  if (d.preg === "yes") {
    notes.push("Pregnancy: manage per local obstetric-hepatology pathway; neonatal HBIG + vaccine at birth as per UK schedule.");
  }

  // Monitoring on TDF
  actions.push("On TDF: monitor HBV DNA, qHBsAg, HBeAg at weeks 12, 24, 48 then every 6 months; check renal function per local policy.");

  // HCC surveillance
  if (d.hccEligible === "yes" || d.cirrhosis === "yes") {
    actions.push("HCC surveillance: ultrasound every 6 months ± AFP as per local standards.");
  }

  // Default if none triggered
  if (actions.length === 0) {
    notes.push("If not meeting treatment criteria, continue routine monitoring per CG165 and reassess.");
  }

  return { actions, notes, warn };
}

function PrintNote({ data, rec }) {
  return (
    <div className="prose dark:prose-invert max-w-none text-sm">
      <h3>Chronic Hepatitis B Clinic Summary</h3>
      <p><strong>HBeAg:</strong> {data.hbeag || "—"} | <strong>HBV DNA:</strong> {data.hbvdna ? `${data.hbvdna} IU/mL` : "—"} | <strong>ALT:</strong> {data.alt ? `${data.alt} U/L` : "—"}</p>
      <p><strong>Fibrosis tool:</strong> {data.fibrosisTool || "—"} | <strong>Stage:</strong> {data.fibrosisStage || "—"}</p>
      <p><strong>Cirrhosis:</strong> {data.cirrhosis || "—"} | <strong>Pregnancy:</strong> {data.preg || "—"} | <strong>Planned immunosuppression:</strong> {data.ims || "—"}</p>
      <p><strong>Red flags:</strong> {data.decomp === "yes" ? "Decompensated liver disease" : "None reported"}</p>

      {rec.warn.length > 0 && (
        <>
          <h4>Urgent alerts</h4>
          <ul>{rec.warn.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </>
      )}

      {rec.actions.length > 0 && (
        <>
          <h4>Recommended actions</h4>
          <ul>{rec.actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </>
      )}

      {rec.notes.length > 0 && (
        <>
          <h4>Notes</h4>
          <ul>{rec.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </>
      )}

      <h4>References</h4>
      <ul>
        <li>NICE CG165: Hepatitis B (chronic): diagnosis and management.</li>
        <li>NICE QS65: 6-monthly HCC surveillance in adults at risk.</li>
      </ul>
      <p className="text-xs">This tool reflects CG165 and does not supersede clinical judgement.</p>
    </div>
  );
}

export default function Page() {
  const [data, setData] = useState({
    hbeag: "",
    hbvdna: "",
    alt: "",
    fibrosisTool: "",
    fibrosisStage: "",
    cirrhosis: "no",
    preg: "no",
    ims: "no",
    decomp: "no",
    hccEligible: "no",
  });

  const rec = useMemo(() => buildRecommendation(data), [data]);

  const on = (k) => (e) => setData((s) => ({ ...s, [k]: e.target.value }));

  const copyText = async () => {
    const el = document.getElementById("printable");
    if (!el) return;
    const text = el.innerText;
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Chronic Hepatitis B — Management (NICE CG165)</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Adults. Clinic setting. UK units.</p>
      </header>

      <Section title="Patient data">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="HBeAg status">
            <select className="w-full input" value={data.hbeag} onChange={on("hbeag")}>
              <option value="">Select</option>
              <option>Positive</option>
              <option>Negative</option>
              <option>Unknown</option>
            </select>
          </Field>

          <Field label="HBV DNA (IU/mL)">
            <input type="number" inputMode="decimal" className="w-full input" value={data.hbvdna} onChange={on("hbvdna")} placeholder="e.g. 12000" />
          </Field>

          <Field label="ALT (U/L)">
            <input type="number" inputMode="decimal" className="w-full input" value={data.alt} onChange={on("alt")} placeholder="e.g. 65" />
          </Field>

          <Field label="Fibrosis assessment tool">
            <select className="w-full input" value={data.fibrosisTool} onChange={on("fibrosisTool")}>
              <option value="">Select</option>
              <option>FibroScan</option>
              <option>Shear-wave elastography</option>
              <option>APRI</option>
              <option>FIB-4</option>
              <option>Liver biopsy</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Fibrosis stage">
            <select className="w-full input" value={data.fibrosisStage} onChange={on("fibrosisStage")}>
              <option value="">Select</option>
              <option value="none">None/minimal</option>
              <option>Significant fibrosis</option>
              <option>Advanced fibrosis</option>
              <option>Cirrhosis</option>
            </select>
          </Field>

          <Field label="Known cirrhosis">
            <select className="w-full input" value={data.cirrhosis} onChange={on("cirrhosis")}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </Field>

          <Field label="Planned immunosuppression">
            <select className="w-full input" value={data.ims} onChange={on("ims")}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </Field>

          <Field label="Pregnancy">
            <select className="w-full input" value={data.preg} onChange={on("preg")}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </Field>

          <Field label="Decompensated disease (encephalopathy, ascites, variceal bleed, INR>1.5, bilirubin>50)">
            <select className="w-full input" value={data.decomp} onChange={on("decomp")}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </Field>

          <Field label="Eligible for HCC surveillance per local criteria">
            <select className="w-full input" value={data.hccEligible} onChange={on("hccEligible")}>
              <option value="no">No/unknown</option>
              <option value="yes">Yes</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Decision">
        {rec.warn.length > 0 && (
          <div className="mb-3 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3">
            <p className="font-semibold">Alerts</p>
            <ul className="list-disc ml-5">{rec.warn.map((w,i)=><li key={i}>{w}</li>)}</ul>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
          <p className="font-semibold mb-2">Recommended actions</p>
          <ul className="list-disc ml-5">{rec.actions.map((a,i)=><li key={i}>{a}</li>)}</ul>
          {rec.notes.length>0 && (
            <>
              <p className="font-semibold mt-3">Notes</p>
              <ul className="list-disc ml-5">{rec.notes.map((n,i)=><li key={i}>{n}</li>)}</ul>
            </>
          )}
        </div>
      </Section>

      <Section title="Print & export">
        <div className="flex gap-2">
          <button onClick={copyText} className="px-3 py-2 rounded-md border">Copy summary</button>
          <button onClick={() => window.print()} className="px-3 py-2 rounded-md border">Print</button>
        </div>
        <div id="printable" className="mt-4">
          <PrintNote data={data} rec={rec} />
        </div>
      </Section>

      <Section title="Guideline anchors">
        <ul className="list-disc ml-5 text-sm">
          <li>Treat cirrhosis irrespective of HBV DNA/ALT; consider treatment if HBV DNA &gt; 2000 IU/mL with necroinflammation/fibrosis. (NICE CG165)</li>
          <li>First line: entecavir or tenofovir disoproxil; peg-IFN optional within licence. (NICE TA96/TA173 as cited in CG165)</li>
          <li>On TDF: virological and serological monitoring at 12, 24, 48 weeks, then 6-monthly. (CG165)</li>
          <li>Immunosuppression: start prophylaxis per CG165 1.5.46–1.5.49.</li>
          <li>HCC surveillance: ultrasound every 6 months ± AFP. (NICE QS65; NHS England minimum standards)</li>
        </ul>
      </Section>

      <footer className="text-xs text-slate-500">
        Version 0.1 • Source: NICE CG165. Review annually.
      </footer>
    </div>
  );
}

