import Link from "next/link";
import NavBar from "@/components/NavBar";
import {
  ShieldAlert,
  Plane,
  ArrowUpRight,
  Activity,
  FileText,
  GraduationCap,
  Siren,
  Radar,
  Dot,
} from "lucide-react";
import { SAMPLE_INTEL } from "../sampleData";

export default function OptionA() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* soft background tint */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-brand/[0.06] via-brand/[0.02] to-transparent" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,14,71,0.08) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <NavBar />

      <MockBadge>Option A · Status hero</MockBadge>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        {/* HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live WHO surveillance · synced 14:02
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-slate-900 leading-[1.05] mb-5">
              Clinical tools for{" "}
              <span className="text-brand">infectious diseases</span>,
              <br />
              built for the bedside.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mb-7">
              Algorithms, risk assessments and live outbreak intelligence
              curated by Infectious Diseases North West. Open, fast, and free
              for NHS clinical use.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/algorithms/travel/risk-assessment-returning-traveller"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors shadow-sm"
              >
                <ShieldAlert className="w-4 h-4" />
                Start VHF risk assessment
              </Link>
              <Link
                href="/algorithms"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors"
              >
                Browse algorithms
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <Stat value="40+" label="Algorithms" />
              <Stat value="24/7" label="Outbreak feed" />
              <Stat value="NHS NW" label="Audience" />
            </div>
          </div>

          {/* LIVE PANEL */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(15,14,71,0.15)] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-slate-50 to-white">
                <div className="flex items-center gap-2">
                  <Radar className="w-4 h-4 text-brand" />
                  <span className="text-sm font-semibold text-slate-800">
                    Outbreak watch
                  </span>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                  ● Live
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {SAMPLE_INTEL.slice(0, 4).map((item, i) => (
                  <li key={i}>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-5 py-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <SeverityDot level={item.severity} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-brand transition-colors">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                            <span>{item.region}</span>
                            <Dot className="w-3 h-3" />
                            <span>{item.date}</span>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors shrink-0 mt-0.5" />
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
              <Link
                href="#"
                className="block px-5 py-3 text-center text-xs font-semibold text-brand bg-slate-50 hover:bg-slate-100 transition-colors border-t border-slate-100"
              >
                View full WHO Disease Outbreak News →
              </Link>
            </div>
          </aside>
        </section>

        {/* CLINICAL TOOLS */}
        <Section label="Clinical Tools" icon={Activity}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToolCard
              href="/algorithms/travel/risk-assessment-returning-traveller"
              icon={ShieldAlert}
              variant="critical"
              title="VHF Risk Assessment"
              subtitle="Rapid screening and risk stratification for returned travellers."
            />
            <ToolCard
              href="/algorithms/travel/travel-history-generator"
              icon={Plane}
              variant="standard"
              title="Travel History Generator"
              subtitle="Structured travel history for clinical documentation."
            />
          </div>
        </Section>

        {/* REFERENCE GRID — denser, single section */}
        <Section label="Reference" icon={FileText}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <RefTile href="/algorithms" icon={Activity} title="Algorithms" />
            <RefTile href="/guidelines" icon={FileText} title="Guidelines" />
            <RefTile href="/teaching" icon={GraduationCap} title="Education" />
            <RefTile
              external
              href="https://travelhealthpro.org.uk"
              icon={Plane}
              title="NaTHNaC"
            />
            <RefTile
              external
              href="https://wwwnc.cdc.gov/travel/notices"
              icon={ShieldAlert}
              title="CDC Travel"
            />
            <RefTile
              external
              href="https://promedmail.org/"
              icon={Siren}
              title="ProMED-mail"
            />
          </div>
        </Section>

        <Footer />
      </main>
    </div>
  );
}

function Section({ label, icon: Icon, children }) {
  return (
    <section className="mb-14">
      <div className="flex items-center gap-3 mb-5">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      {children}
    </section>
  );
}

function ToolCard({ href, icon: Icon, variant, title, subtitle }) {
  const styles =
    variant === "critical"
      ? { ring: "ring-red-100", iconBg: "bg-red-50", iconColor: "text-red-600", tag: "bg-red-50 text-red-700 border-red-100", tagLabel: "Critical" }
      : { ring: "ring-emerald-100", iconBg: "bg-emerald-50", iconColor: "text-emerald-600", tag: "bg-emerald-50 text-emerald-700 border-emerald-100", tagLabel: "Tool" };
  return (
    <Link
      href={href}
      className={`group relative flex flex-col p-6 rounded-2xl bg-white border border-slate-200 ring-1 ${styles.ring} hover:shadow-md hover:-translate-y-0.5 transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${styles.tag}`}
        >
          {styles.tagLabel}
        </span>
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-brand transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>
      <ArrowUpRight className="absolute bottom-5 right-5 w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
    </Link>
  );
}

function RefTile({ href, icon: Icon, title, external }) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex flex-col gap-2 p-4 rounded-xl bg-white border border-slate-200 hover:border-brand/40 hover:shadow-sm transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-brand/10 flex items-center justify-center text-slate-500 group-hover:text-brand transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm font-semibold text-slate-800 group-hover:text-brand transition-colors">
        {title}
      </p>
    </Link>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight">
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function SeverityDot({ level }) {
  const map = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  };
  return (
    <span className="mt-1.5 shrink-0 inline-flex">
      <span className={`w-2 h-2 rounded-full ${map[level] || "bg-slate-400"}`} />
    </span>
  );
}

function Footer() {
  return (
    <footer className="pt-10 mt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-500">
      <div>
        <div className="font-semibold text-slate-700 mb-1">
          ID North West
        </div>
        <p className="text-xs leading-relaxed">
          Clinical algorithms and tools curated for the NHS North West
          infectious diseases network.
        </p>
      </div>
      <div>
        <div className="font-semibold text-slate-700 mb-1">Tools</div>
        <ul className="space-y-1 text-xs">
          <li>
            <Link href="/algorithms" className="hover:text-slate-700">
              Algorithms
            </Link>
          </li>
          <li>
            <Link href="/guidelines" className="hover:text-slate-700">
              Guidelines
            </Link>
          </li>
          <li>
            <Link href="/teaching" className="hover:text-slate-700">
              Education
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <div className="font-semibold text-slate-700 mb-1">Contact</div>
        <a
          href="mailto:infectionnw@gmail.com"
          className="text-xs hover:text-slate-700"
        >
          infectionnw@gmail.com
        </a>
        <p className="text-[11px] text-slate-400 mt-2">
          For clinical reference use within NHS NW.
        </p>
      </div>
    </footer>
  );
}

function MockBadge({ children }) {
  return (
    <div className="sticky top-16 z-40 bg-amber-50/95 backdrop-blur border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] font-medium text-amber-800">
        <span>{children}</span>
        <Link href="/mocks" className="underline hover:text-amber-900">
          ← All options
        </Link>
      </div>
    </div>
  );
}
