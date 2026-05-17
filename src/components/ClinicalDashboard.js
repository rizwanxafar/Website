import Link from "next/link";
import {
  ShieldAlert,
  Plane,
  ArrowUpRight,
  Activity,
  FileText,
  GraduationCap,
  Siren,
} from "lucide-react";
import NavBar from "./NavBar";

export default function ClinicalDashboard({ intelData }) {
  const items = Array.isArray(intelData) ? intelData : [];

  return (
    <div className="min-h-screen bg-[#FAF8F4] relative">
      <PaperGrain />
      <NavBar />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        {/* HERO */}
        <section className="text-center mb-16">
          <h1
            className="text-5xl md:text-7xl font-bold tracking-[-0.04em] text-slate-900 leading-[0.95] mb-6"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Welcome to
            <br />
            Infectious Diseases
            <br />
            North West
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto mb-10">
            Algorithms and tools for Infectious Diseases. Built for clinical
            use.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/algorithms/travel/risk-assessment-returning-traveller"
              className="inline-flex items-center justify-center w-full sm:w-auto sm:min-w-[260px] px-6 py-3.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              VHF Risk Assessment
            </Link>
            <Link
              href="/algorithms/travel/travel-history-generator"
              className="inline-flex items-center justify-center w-full sm:w-auto sm:min-w-[260px] px-6 py-3.5 rounded-xl bg-white text-slate-900 text-sm font-semibold border border-slate-900 hover:bg-slate-50 transition-colors"
            >
              Travel History Generator
            </Link>
          </div>
        </section>

        {/* WHO Disease Outbreak News — scrollable panel */}
        <Panel className="mb-8">
          <PanelHeader
            title="WHO Disease Outbreak News"
            cta={{
              href: "https://www.who.int/emergencies/disease-outbreak-news",
              label: "View all",
              external: true,
            }}
          />
          <div className="relative mt-7">
            <div className="max-h-[640px] overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 pb-8">
                {items.length > 0 ? (
                  items.map((item, i) => (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-slate-500 mb-2">
                        {item.region && (
                          <>
                            <span>{item.region}</span>
                            <span className="text-slate-300">·</span>
                          </>
                        )}
                        <span>{item.date}</span>
                      </div>
                      <h3
                        className="text-xl font-bold tracking-tight text-slate-900 leading-snug mb-2 group-hover:text-brand transition-colors"
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                      >
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      )}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 col-span-full py-8 text-center">
                    Feed unavailable.
                  </p>
                )}
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-2 h-16 bg-gradient-to-t from-white to-transparent" />
          </div>
        </Panel>

        {/* Reference */}
        <Panel className="mb-12">
          <PanelHeader title="Reference" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-7">
            <RefRow
              href="/algorithms"
              icon={Activity}
              title="Algorithms"
              body="Interactive clinical pathways"
            />
            <RefRow
              href="/guidelines"
              icon={FileText}
              title="Guidelines"
              body="Local reference documents"
            />
            <RefRow
              href="/teaching"
              icon={GraduationCap}
              title="Education"
              body="Teaching and case studies"
            />
            <RefRow
              external
              href="https://travelhealthpro.org.uk"
              icon={Plane}
              title="NaTHNaC"
              body="National travel health advisory"
            />
            <RefRow
              external
              href="https://wwwnc.cdc.gov/travel/notices"
              icon={ShieldAlert}
              title="CDC Travel"
              body="US CDC travel health notices"
            />
            <RefRow
              external
              href="https://promedmail.org/"
              icon={Siren}
              title="ProMED-mail"
              body="Global infectious disease monitor"
            />
          </div>
        </Panel>

        <footer className="pt-6 flex items-center justify-between text-xs text-slate-500">
          <span>ID-Northwest © {new Date().getFullYear()}</span>
          <a
            href="mailto:infectionnw@gmail.com"
            className="hover:text-slate-800 transition-colors"
          >
            Contact
          </a>
        </footer>
      </main>
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-20px_rgba(15,14,71,0.12)] p-7 md:p-9 ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHeader({ title, cta }) {
  return (
    <div className="flex items-end justify-between gap-6 pb-4 border-b border-slate-100">
      <h2
        className="text-xl md:text-2xl font-bold tracking-tight text-slate-900"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {title}
      </h2>
      {cta && (
        <Link
          href={cta.href}
          target={cta.external ? "_blank" : undefined}
          rel={cta.external ? "noopener noreferrer" : undefined}
          className="text-sm font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 whitespace-nowrap pb-0.5 transition-colors"
        >
          {cta.label}
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function PaperGrain() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 w-full h-full opacity-[0.035] mix-blend-multiply"
      aria-hidden="true"
    >
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>
  );
}

function RefRow({ href, icon: Icon, title, body, external }) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-start gap-3 p-4 rounded-xl bg-[#FAF8F4]/60 border border-slate-200 hover:border-slate-300 hover:bg-white transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-slate-500 group-hover:text-slate-900 transition-colors border border-slate-200">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
          {title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{body}</p>
      </div>
    </Link>
  );
}
