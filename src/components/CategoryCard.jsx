function CategoryCard({ href, title }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border-2 border-slate-300 bg-white p-10 flex items-center justify-center text-lg font-semibold text-slate-900 transition hover:border-violet-500 hover:shadow-lg hover:text-violet-700 hover:bg-violet-50"
    >
      {title}
    </Link>
  );
}
