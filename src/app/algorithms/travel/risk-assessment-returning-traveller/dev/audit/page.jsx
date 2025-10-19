// src/app/algorithms/travel/risk-assessment-returning-traveller/dev/audit/page.jsx
"use client";

import { useMemo, useState } from "react";
import * as SNAP from "@/data/hcidFallbackSnapshot";
import { normalizeName, buildNormalizedMap } from "@/utils/names";

// --- Text helpers and rules used by the app ---
const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (d = "") => txt(d).includes("no known hcid");
const isTravelAssociated = (d = "") => txt(d).includes("travel associated");
// Exposures step also treats these as import-linked and thus non-triggering
const isImportedLike = (e = "") =>
  /(imported cases only|associated with a case import|import[-\s]?related)/i.test(String(e));

const RX = {
  lassa: /lassa/i,
  ebmarb: /(ebola|ebolavirus|ebola\s*virus|e\.?v\.?d|marburg)/i,
  cchf: /(cchf|crimean[-\s]?congo|crimea[-\s]?congo)/i,
};

// Pick object from fallback snapshot
function pickRiskMap(mod) {
  const candidates = [mod.default, mod.risk, mod.riskMap, mod.snapshot, mod.data, mod.HCID, mod.HCID_COUNTRY_RISK].filter(Boolean);
  for (const c of candidates) {
    if (c && typeof c === "object" && !Array.isArray(c)) return c;
    if (c && typeof c?.countries === "object") return c.countries;
    if (c && typeof c?.map === "object") return c.map;
  }
  for (const v of Object.values(mod)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const vals = Object.values(v);
      if (vals.length && Array.isArray(vals[0])) return v;
    }
  }
  return {};
}

export default function AuditPage() {
  const [q, setQ] = useState("");

  const RISK_RAW = pickRiskMap(SNAP);                  // { country: [ { disease, evidence, year } ] }
  const nmap = useMemo(() => buildNormalizedMap(RISK_RAW), [RISK_RAW]);

  // Build concise, two-column audit: what Review shows vs what Exposures asks
  const rows = useMemo(() => {
    const out = [];
    for (const [rawName] of Object.entries(RISK_RAW || {})) {
      const key = normalizeName(rawName);
      const entries = nmap.get(key) || [];

      // ReviewStep shows all entries except "No known HCID" and "Travel associated"
      const reviewShown = (entries || [])
        .filter((e) => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease))
        .map((e) => e.disease)
        .filter(Boolean);

      // ExposuresStep uses same filter AND excludes import-linked evidence
      const expFiltered = (entries || [])
        .filter(
          (e) =>
            !isNoKnownHcid(e.disease) &&
            !isTravelAssociated(e.disease) &&
            !isImportedLike(e.evidence)
        );

      const asks = [];
      if (expFiltered.some((e) => RX.lassa.test(e?.disease || ""))) asks.push("Lassa");
      if (expFiltered.some((e) => RX.ebmarb.test(e?.disease || ""))) asks.push("Ebola/Marburg");
      if (expFiltered.some((e) => RX.cchf.test(e?.disease || ""))) asks.push("CCHF");

      out.push({
        country: rawName,
        reviewText: reviewShown.join("; "),
        exposureText: asks.join(", "),
      });
    }

    return out
      .filter((r) =>
        q
          ? r.country.toLowerCase().includes(q.toLowerCase()) ||
            r.reviewText.toLowerCase().includes(q.toLowerCase()) ||
            r.exposureText.toLowerCase().includes(q.toLowerCase())
          : true
      )
      .sort((a, b) => a.country.localeCompare(b.country));
  }, [RISK_RAW, nmap, q]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">VHF Audit: Review vs Exposure</h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search country or disease…"
        className="px-3 py-2 border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200 dark:border-slate-700">
              <th className="py-2 pr-4 w-[28%]">Country</th>
              <th className="py-2 pr-4">Diseases shown at Review</th>
              <th className="py-2 pr-4 w-[24%]">Exposure questions asked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.country} className="border-b border-slate-100 dark:border-slate-800 align-top">
                <td className="py-2 pr-4">{r.country}</td>
                <td className="py-2 pr-4 text-slate-800 dark:text-slate-200">
                  {r.reviewText || <span className="text-slate-500">—</span>}
                </td>
                <td className="py-2 pr-4">
                  {r.exposureText || <span className="text-slate-500">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Review excludes “no known HCID” and “travel associated”. Exposure excludes those and import-linked evidence.
      </p>
    </div>
  );
}
