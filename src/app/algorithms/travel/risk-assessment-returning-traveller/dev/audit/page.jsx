// src/app/algorithms/travel/risk-assessment-returning-traveller/dev/audit/page.jsx
"use client";

import { useMemo, useState } from "react";
import * as SNAP from "@/data/hcidFallbackSnapshot";
import { normalizeName, buildNormalizedMap } from "@/utils/names";

const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (d = "") => txt(d).includes("no known hcid");
const isTravelAssociated = (d = "") => txt(d).includes("travel associated");
// Treat import-linked wording as non-triggering for exposures
const isImportedLike = (e = "") =>
  /(imported cases only|associated with a case import|import[-\s]?related)/i.test(String(e));

const RX = {
  lassa: /lassa/i,
  ebmarb: /(ebola|ebolavirus|ebola\s*virus|e\.?v\.?d|marburg)/i,
  cchf: /(cchf|crimean[-\s]?congo|crimea[-\s]?congo)/i,
};

function pickRiskMap(mod) {
  // Try common exports
  const candidates = [
    mod.default,
    mod.risk,
    mod.riskMap,
    mod.snapshot,
    mod.data,
    mod.HCID,
    mod.HCID_COUNTRY_RISK,
  ].filter(Boolean);

  for (const c of candidates) {
    if (c && typeof c === "object" && !Array.isArray(c)) return c;
    if (c && typeof c?.countries === "object") return c.countries;
    if (c && typeof c?.map === "object") return c.map;
  }

  // Fallback: pick first object that looks like { country: [ {disease...} ] }
  for (const v of Object.values(mod)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const vals = Object.values(v);
      if (vals.length && Array.isArray(vals[0])) return v;
    }
  }

  return {};
}

function evaluate(entries = []) {
  const filtered = (entries || []).filter(
    (e) =>
      !isNoKnownHcid(e.disease) &&
      !isTravelAssociated(e.disease) &&
      !isImportedLike(e.evidence)
  );
  const show = {
    Lassa: filtered.some((e) => RX.lassa.test(e?.disease || "")),
    EbMarb: filtered.some((e) => RX.ebmarb.test(e?.disease || "")),
    CCHF: filtered.some((e) => RX.cchf.test(e?.disease || "")),
  };
  return { filtered, show };
}

export default function AuditPage() {
  const [q, setQ] = useState("");
  const RISK_RAW = pickRiskMap(SNAP);
  const nmap = useMemo(() => buildNormalizedMap(RISK_RAW), [RISK_RAW]);

  const rows = useMemo(() => {
    const out = [];
    for (const [rawName, entries] of Object.entries(RISK_RAW || {})) {
      const key = normalizeName(rawName);
      const nEntries = nmap.get(key) || [];
      const { filtered, show } = evaluate(nEntries);
      out.push({
        rawName,
        key,
        total: (nEntries || []).length,
        filteredCount: filtered.length,
        Lassa: show.Lassa,
        EbMarb: show.EbMarb,
        CCHF: show.CCHF,
        sample: filtered.map((e) => e.disease).slice(0, 3).join("; "),
      });
    }
    return out;
  }, [RISK_RAW, nmap]);

  const filteredRows = rows
    .filter((r) =>
      q ? r.rawName.toLowerCase().includes(q.toLowerCase()) || r.key.includes(q.toLowerCase()) : true
    )
    .sort((a, b) => a.rawName.localeCompare(b.rawName));

  const totals = useMemo(
    () => ({
      countries: rows.length,
      anyLassa: rows.filter((r) => r.Lassa).length,
      anyEbMarb: rows.filter((r) => r.EbMarb).length,
      anyCCHF: rows.filter((r) => r.CCHF).length,
      none: rows.filter((r) => !r.Lassa && !r.EbMarb && !r.CCHF).length,
    }),
    [rows]
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">VHF Exposure Audit</h1>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search country…"
          className="px-3 py-2 border rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
        />
        <div className="text-slate-600 dark:text-slate-300">
          Countries: {totals.countries} · Lassa: {totals.anyLassa} · Ebola/Marburg: {totals.anyEbMarb} · CCHF: {totals.anyCCHF} · None: {totals.none}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200 dark:border-slate-700">
              <th className="py-2 pr-4">Country</th>
              <th className="py-2 pr-4">Key</th>
              <th className="py-2 pr-4">Entries</th>
              <th className="py-2 pr-4">Filtered</th>
              <th className="py-2 pr-4">Lassa</th>
              <th className="py-2 pr-4">Ebola/Marburg</th>
              <th className="py-2 pr-4">CCHF</th>
              <th className="py-2 pr-4">Sample filtered diseases</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.key} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2 pr-4">{r.rawName}</td>
                <td className="py-2 pr-4 text-slate-500">{r.key}</td>
                <td className="py-2 pr-4">{r.total}</td>
                <td className="py-2 pr-4">{r.filteredCount}</td>
                <td className="py-2 pr-4">{r.Lassa ? "Yes" : ""}</td>
                <td className="py-2 pr-4">{r.EbMarb ? "Yes" : ""}</td>
                <td className="py-2 pr-4">{r.CCHF ? "Yes" : ""}</td>
                <td className="py-2 pr-4 text-slate-500">{r.sample}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Rules: exclude “no known HCID”, exclude “travel associated”, exclude import-linked evidence.
      </p>
    </div>
  );
}
