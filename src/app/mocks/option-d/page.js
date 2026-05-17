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
import { SAMPLE_INTEL } from "../sampleData";

// ---- Region derivation -------------------------------------------------
// WHO DON titles follow "Disease – Country" or "Disease – Region phrase".
// We parse the tail of the title, map known WHO region phrases first,
// then fall back to a country -> WHO-region lookup.
// In production this lookup would live in a shared helper with a full
// country list (~200 entries). Sample-data coverage is enough here.
const REGION_PHRASES = [
  ["African Region", "Africa"],
  ["Region of the Americas", "Americas"],
  ["South-East Asia Region", "South-East Asia"],
  ["South-East Asia", "South-East Asia"],
  ["European Region", "Europe"],
  ["Eastern Mediterranean Region", "Eastern Mediterranean"],
  ["Eastern Mediterranean", "Eastern Mediterranean"],
  ["Western Pacific Region", "Western Pacific"],
];

// Country -> WHO region label. WHO assigns each country to exactly one
// of six regional offices; we use the friendly short labels here.
const COUNTRY_TO_REGION = {
  // African Region
  "Tanzania": "Africa",
  "United Republic of Tanzania": "Africa",
  "Democratic Republic of the Congo": "Africa",
  "Nigeria": "Africa",
  "Ethiopia": "Africa",
  "Mauritania": "Africa",
  // Region of the Americas
  "United States of America": "Americas",
  "United States": "Americas",
  "Brazil": "Americas",
  // South-East Asia Region — none in current sample
  // European Region
  "Sweden": "Europe",
  "Italy": "Europe",
  "Greece": "Europe",
  "Türkiye": "Europe",
  "Turkey": "Europe",
  // Eastern Mediterranean Region
  "Sudan": "Eastern Mediterranean",
  "Saudi Arabia": "Eastern Mediterranean",
  "Pakistan": "Eastern Mediterranean",
  "Iraq": "Eastern Mediterranean",
  // Western Pacific Region
  "Cambodia": "Western Pacific",
  "Viet Nam": "Western Pacific",
  "Vietnam": "Western Pacific",
};

function deriveRegion(title) {
  if (!title) return null;
  const parts = title.split(/\s[–—-]\s/);
  if (parts.length < 2) return null;
  const tail = parts[parts.length - 1].trim();

  for (const [phrase, label] of REGION_PHRASES) {
    if (tail.includes(phrase)) return label;
  }

  const parenMatch = tail.match(/\(([^)]+)\)/);
  if (parenMatch) {
    for (const [phrase, label] of REGION_PHRASES) {
      if (parenMatch[1].includes(phrase)) return label;
    }
  }

  const country = tail.replace(/\s*\(.+?\)\s*/g, "").trim();
  return COUNTRY_TO_REGION[country] || null;
}

// Option D — editorial direction with text-only action chips, frosted nav,
// and the WHO + Reference sections held in rounded-rectangle panels.
export default function OptionD() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] relative">
      <PaperGrain />
      <FrostedNav />
      <MockBadge>Option D · Refined hero + panels</MockBadge>

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

          {/* TEXT-ONLY ACTION CHIPS */}
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

        {/* WHO Disease Outbreak News — white panel, scrollable */}
        <Panel className="mb-8">
          <PanelHeader
            title="WHO Disease Outbreak News"
            cta={{ href: "#", label: "View all" }}
          />
          <div className="relative mt-7">
            <div className="max-h-[640px] overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 pb-8">
                {SAMPLE_INTEL.slice(0, 20).map((item, i) => {
                  const region = deriveRegion(item.title);
                  return (
                    <a
                      key={i}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-slate-500 mb-2">
                        {region && (
                          <>
                            <span>{region}</span>
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
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </a>
                  );
                })}
              </div>
            </div>
            {/* fade hint that more content lies below */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-2 h-16 bg-gradient-to-t from-white to-transparent" />
          </div>
        </Panel>

        {/* Reference — merged Important Links + Resources, panel */}
        <Panel className="mb-12">
          <PanelHeader title="Reference" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-7">
            <RefRow href="/algorithms" icon={Activity} title="Algorithms" body="Interactive clinical pathways" />
            <RefRow href="/guidelines" icon={FileText} title="Guidelines" body="Local reference documents" />
            <RefRow href="/teaching" icon={GraduationCap} title="Education" body="Teaching and case studies" />
            <RefRow external href="https://travelhealthpro.org.uk" icon={Plane} title="NaTHNaC" body="National travel health advisory" />
            <RefRow external href="https://wwwnc.cdc.gov/travel/notices" icon={ShieldAlert} title="CDC Travel" body="US CDC travel health notices" />
            <RefRow external href="https://promedmail.org/" icon={Siren} title="ProMED-mail" body="Global infectious disease monitor" />
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

// ---------- Panel wrapper ----------
function Panel({ children, className = "", tone = "light" }) {
  const tones = {
    light:
      "bg-white ring-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-20px_rgba(15,14,71,0.12)]",
    dark:
      "bg-slate-900 ring-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.18),0_20px_44px_-20px_rgba(0,0,0,0.45)]",
  };
  return (
    <section
      className={`rounded-2xl ring-1 p-7 md:p-9 ${tones[tone]} ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHeader({ title, cta, tone = "light" }) {
  const titleClr = tone === "dark" ? "text-white" : "text-slate-900";
  const divider = tone === "dark" ? "border-white/10" : "border-slate-100";
  const ctaClr =
    tone === "dark"
      ? "text-white/70 hover:text-white"
      : "text-slate-700 hover:text-slate-900";
  return (
    <div className={`flex items-end justify-between gap-6 pb-4 border-b ${divider}`}>
      <h2
        className={`text-xl md:text-2xl font-bold tracking-tight ${titleClr}`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {title}
      </h2>
      {cta && (
        <Link
          href={cta.href}
          className={`text-sm font-semibold inline-flex items-center gap-1 whitespace-nowrap pb-0.5 transition-colors ${ctaClr}`}
        >
          {cta.label}
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// ---------- Frosted editorial navbar ----------
function FrostedNav() {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F4]/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-slate-900 tracking-tight text-base"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          ID<span className="text-brand">·</span>Northwest
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          {[
            { href: "/algorithms", label: "Tools" },
            { href: "/guidelines", label: "Guidelines" },
            { href: "/teaching", label: "Teaching" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
            >
              {item.label}
              <span className="absolute left-0 right-0 -bottom-1 h-px bg-slate-900 origin-left scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
          ))}
          <Link
            href="mailto:infectionnw@gmail.com"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}

// ---------- Paper grain background ----------
function PaperGrain() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 w-full h-full opacity-[0.035] mix-blend-multiply"
      aria-hidden="true"
    >
      <filter id="d-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#d-grain)" />
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

function MockBadge({ children }) {
  return (
    <div className="sticky top-0 z-50 bg-amber-50/95 backdrop-blur border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] font-medium text-amber-800">
        <span>{children}</span>
        <Link href="/mocks" className="underline hover:text-amber-900">
          ← All options
        </Link>
      </div>
    </div>
  );
}
