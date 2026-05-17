import Link from "next/link";
import NavBar from "@/components/NavBar";

const options = [
  {
    href: "/mocks/option-a",
    label: "Option A",
    title: "Status hero",
    description:
      "Split hero — heading on the left, live outbreak panel on the right. Signals freshness immediately.",
    accent: "from-indigo-500/20 to-transparent",
  },
  {
    href: "/mocks/option-b",
    label: "Option B",
    title: "Action hero",
    description:
      "The clinical tools are the hero. Opens with what clinicians came to do, then a calmer feed below.",
    accent: "from-emerald-500/20 to-transparent",
  },
  {
    href: "/mocks/option-c",
    label: "Option C",
    title: "Dense dark dashboard",
    description:
      "Dark mode, working-tool feel. Sidebar quick-access, dense outbreak feed, compact reference grid.",
    accent: "from-violet-500/20 to-transparent",
  },
  {
    href: "/mocks/option-d",
    label: "Option D",
    title: "Editorial / search-first",
    description:
      "Quiet display-type hero, prominent command bar, magazine-style outbreak grid. Calmer, browsable.",
    accent: "from-amber-500/20 to-transparent",
  },
  {
    href: "/mocks/option-d1",
    label: "Option D1",
    title: "Museum / EM imagery",
    description:
      "D's layout with colourised electron-microscopy as art. A featured plate, image thumbnails on outbreaks.",
    accent: "from-fuchsia-500/20 to-transparent",
  },
  {
    href: "/mocks/option-d2",
    label: "Option D2",
    title: "Molecular illustration",
    description:
      "D's layout with hand-painted Goodsell-style pathogen art. Warmer palette, illustrated pathogen library.",
    accent: "from-orange-500/20 to-transparent",
  },
];

export default function MocksIndex() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Homepage redesign
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">
            Four directions to look at
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Each option is a static mock with the same content blocks rearranged
            around a different organising idea. Pick one as the anchor — they’re
            not meant to be combined.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${o.accent} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    {o.label}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">Preview</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {o.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {o.description}
                </p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  View mock
                  <span aria-hidden>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-xs text-slate-400">
          Real homepage is unchanged at{" "}
          <Link href="/" className="underline hover:text-slate-600">
            /
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
