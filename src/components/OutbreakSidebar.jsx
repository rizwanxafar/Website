// src/components/OutbreakSidebar.jsx
"use client";

import { useEffect, useMemo, useState } from "react";

export default function OutbreakSidebar({
  countries = [],
  recencyDays = 365,
  perCountryCap = 5,
}) {
  const [data, setData] = useState(null); // { source, fetchedAt, windowDays, byCountry }
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const countryList = useMemo(() => {
    // Deduplicate & keep order
    const seen = new Set();
    const arr = [];
    for (const c of countries) {
      if (c && !seen.has(c)) {
        seen.add(c);
        arr.push(c);
      }
    }
    return arr;
  }, [countries]);

  useEffect(() => {
    if (!countryList.length) return;
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const qs = new URLSearchParams({
          countries: countryList.join(","),
          days: String(recencyDays),
        }).toString();
        const r = await fetch(`/api/wwho-don?${qs}`.replace("wwho", "who"), {
          cache: "no-store",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        setData(j);
      } catch (e) {
        setErr("Could not load WHO outbreak news right now.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [countryList, recencyDays]);

  const fetchedAt = data?.fetchedAt ? new Date(data.fetchedAt) : null;

  return (
    <aside className="lg:sticky lg:top-6">
      <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            WHO Disease Outbreak News
          </h3>
          {loading && (
            <span className="text-xs text-slate-500 dark:text-slate-400">Loading…</span>
          )}
        </div>

        {err && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            {err}{" "}
            <a
              href="https://www.who.int/emergencies/disease-outbreak-news"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Open WHO DON
            </a>
            .
          </p>
        )}

        {!err && !loading && data && (
          <div className="mt-3 space-y-4">
            {countryList.map((c) => {
              const items = (data.byCountry?.[c] || []).slice(0, perCountryCap);
              if (items.length === 0) return null;
              return (
                <div key={c}>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                    {c}
                  </div>
                  <ul className="space-y-2">
                    {items.map((it) => (
                      <li key={`${c}-${it.url}`}>
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline"
                        >
                          {it.title}
                        </a>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {it.published ? new Date(it.published).toLocaleDateString() : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Source: WHO Disease Outbreak News.{" "}
              {fetchedAt && (
                <span>
                  Refreshed {fetchedAt.toLocaleDateString()}{" "}
                  {fetchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              . For the latest updates, always check the appropriate official websites.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
