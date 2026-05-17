import Link from "next/link";
import {
  ShieldAlert,
  Plane,
  ArrowUpRight,
  Activity,
  FileText,
  GraduationCap,
  Siren,
  Radar,
  Search,
  Command,
  Home,
  BookOpen,
  Stethoscope,
} from "lucide-react";
import { SAMPLE_INTEL } from "../sampleData";

// Option C does its own dark chrome instead of the standard NavBar
// to demonstrate the dashboard direction end-to-end.
export default function OptionC() {
  return (
    <div className="min-h-screen bg-[#0B0D14] text-slate-300 antialiased">
      <MockBadge>Option C · Dense dark dashboard</MockBadge>

      <div className="flex">
        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/5 bg-[#0B0D14] sticky top-0 h-screen px-4 py-5">
          <Link href="/" className="flex items-center gap-2.5 mb-8 px-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold bg-indigo-500/90">
              ID
            </span>
            <div>
              <div className="text-sm font-semibold text-white tracking-tight">
                ID North West
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Clinical OS
              </div>
            </div>
          </Link>

          <div className="px-2 mb-5">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/5 text-sm text-slate-400 hover:bg-white/[0.06] transition-colors"
              type="button"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-slate-500">
                <Command className="w-3 h-3" />K
              </span>
            </button>
          </div>

          <NavGroup label="Workspace">
            <SideLink href="#" icon={Home} active>
              Overview
            </SideLink>
            <SideLink href="/algorithms" icon={Activity}>
              Algorithms
            </SideLink>
            <SideLink href="/guidelines" icon={FileText}>
              Guidelines
            </SideLink>
            <SideLink href="/teaching" icon={GraduationCap}>
              Education
            </SideLink>
          </NavGroup>

          <NavGroup label="Tools">
            <SideLink
              href="/algorithms/travel/risk-assessment-returning-traveller"
              icon={ShieldAlert}
              accent
            >
              VHF Risk Assessment
            </SideLink>
            <SideLink
              href="/algorithms/travel/travel-history-generator"
              icon={Plane}
            >
              Travel History
            </SideLink>
          </NavGroup>

          <NavGroup label="External">
            <SideLink href="https://promedmail.org/" icon={Siren} external>
              ProMED-mail
            </SideLink>
            <SideLink
              href="https://travelhealthpro.org.uk"
              icon={BookOpen}
              external
            >
              NaTHNaC
            </SideLink>
          </NavGroup>

          <div className="mt-auto px-2 pt-6 text-[10px] text-slate-600">
            v2.0 · synced 14:02
          </div>
        </aside>

        {/* MAIN */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0B0D14]/95 backdrop-blur">
            <div className="px-6 lg:px-10 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Workspace</span>
                <span className="text-slate-700">/</span>
                <span className="text-slate-300 font-medium">Overview</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live · WHO feed
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">14 May 2026</span>
              </div>
            </div>
          </header>

          <main className="px-6 lg:px-10 py-10 max-w-6xl">
            {/* Greeting */}
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300/80 mb-2">
                Good afternoon
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
                Six active outbreak signals worth watching.
              </h1>
              <p className="text-sm text-slate-400">
                Start with a clinical tool or scan the latest WHO Disease
                Outbreak News.
              </p>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              <Kpi label="Active outbreaks" value="6" delta="+2 this week" />
              <Kpi label="Algorithms" value="42" delta="2 updated" />
              <Kpi label="Last sync" value="14:02" delta="Hourly" />
              <Kpi label="Region" value="NHS NW" delta="UK" />
            </div>

            {/* Two-column working area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
              {/* Tools column */}
              <div className="lg:col-span-5 space-y-3">
                <ColumnTitle icon={Stethoscope}>Clinical tools</ColumnTitle>
                <DarkToolCard
                  href="/algorithms/travel/risk-assessment-returning-traveller"
                  icon={ShieldAlert}
                  title="VHF Risk Assessment"
                  subtitle="Returned-traveller screening pathway."
                  badge="Critical"
                  badgeColor="bg-red-500/15 text-red-300 border-red-500/30"
                  iconBg="bg-red-500/15 text-red-300"
                />
                <DarkToolCard
                  href="/algorithms/travel/travel-history-generator"
                  icon={Plane}
                  title="Travel History Generator"
                  subtitle="Structured travel narrative for notes."
                  badge="Tool"
                  badgeColor="bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  iconBg="bg-emerald-500/15 text-emerald-300"
                />
                <DarkToolCard
                  href="/algorithms"
                  icon={Activity}
                  title="All algorithms"
                  subtitle="Browse the full library."
                  badge="Browse"
                  badgeColor="bg-slate-500/15 text-slate-300 border-slate-500/30"
                  iconBg="bg-slate-500/15 text-slate-300"
                />
              </div>

              {/* Feed column */}
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between mb-3">
                  <ColumnTitle icon={Radar}>Outbreak feed</ColumnTitle>
                  <Link
                    href="#"
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    View all →
                  </Link>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                      <tr>
                        <th className="text-left font-semibold py-2.5 pl-4 w-6"></th>
                        <th className="text-left font-semibold py-2.5">
                          Event
                        </th>
                        <th className="text-left font-semibold py-2.5 hidden md:table-cell">
                          Region
                        </th>
                        <th className="text-right font-semibold py-2.5 pr-4">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {SAMPLE_INTEL.map((item, i) => (
                        <tr
                          key={i}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="pl-4 py-3 align-top">
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full ${
                                item.severity === "high"
                                  ? "bg-red-400"
                                  : item.severity === "medium"
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                              }`}
                            />
                          </td>
                          <td className="py-3 pr-4">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block"
                            >
                              <div className="text-slate-100 font-medium leading-snug group-hover:text-white">
                                {item.title}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {item.description}
                              </div>
                            </a>
                          </td>
                          <td className="py-3 text-xs text-slate-400 hidden md:table-cell">
                            {item.region}
                          </td>
                          <td className="py-3 pr-4 text-right text-xs text-slate-400 whitespace-nowrap">
                            {item.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Reference rail */}
            <div className="mb-12">
              <ColumnTitle icon={BookOpen}>Reference</ColumnTitle>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <DarkRef href="/algorithms" icon={Activity} label="Algorithms" />
                <DarkRef href="/guidelines" icon={FileText} label="Guidelines" />
                <DarkRef
                  href="/teaching"
                  icon={GraduationCap}
                  label="Education"
                />
                <DarkRef
                  external
                  href="https://travelhealthpro.org.uk"
                  icon={Plane}
                  label="NaTHNaC"
                />
                <DarkRef
                  external
                  href="https://wwwnc.cdc.gov/travel/notices"
                  icon={ShieldAlert}
                  label="CDC Travel"
                />
                <DarkRef
                  external
                  href="https://promedmail.org/"
                  icon={Siren}
                  label="ProMED"
                />
              </div>
            </div>

            <footer className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
              <span>ID North West © {new Date().getFullYear()}</span>
              <a
                href="mailto:infectionnw@gmail.com"
                className="hover:text-slate-300"
              >
                infectionnw@gmail.com
              </a>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

function NavGroup({ label, children }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-1.5">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SideLink({ href, icon: Icon, children, active, external, accent }) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
        active
          ? "bg-white/[0.06] text-white"
          : accent
          ? "text-red-300/90 hover:bg-white/[0.04] hover:text-red-200"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{children}</span>
      {external && <ArrowUpRight className="ml-auto w-3 h-3 opacity-50" />}
    </Link>
  );
}

function Kpi({ label, value, delta }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-white tracking-tight">
        {value}
      </div>
      <div className="text-[11px] text-slate-500 mt-0.5">{delta}</div>
    </div>
  );
}

function ColumnTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
      <Icon className="w-3.5 h-3.5" />
      {children}
    </div>
  );
}

function DarkToolCard({
  href,
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeColor,
  iconBg,
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all"
    >
      <div className={`p-2 rounded-lg ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{title}</span>
          <span
            className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeColor}`}
          >
            {badge}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{subtitle}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors mt-0.5" />
    </Link>
  );
}

function DarkRef({ href, icon: Icon, label, external }) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-2 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all"
    >
      <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
      <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
        {label}
      </span>
      {external && (
        <ArrowUpRight className="ml-auto w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
      )}
    </Link>
  );
}

function MockBadge({ children }) {
  return (
    <div className="sticky top-0 z-50 bg-amber-500/15 backdrop-blur border-b border-amber-500/30">
      <div className="px-4 lg:px-10 py-1.5 flex items-center justify-between text-[11px] font-medium text-amber-200">
        <span>{children}</span>
        <Link href="/mocks" className="underline hover:text-amber-50">
          ← All options
        </Link>
      </div>
    </div>
  );
}
