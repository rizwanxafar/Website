function CategoryCard({ href, title }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-10 flex items-center justify-center text-lg font-semibold text-slate-900 dark:text-slate-100 transition hover:border-violet-500 dark:hover:border-violet-400 hover:shadow-lg hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
    >
      {title}
    </Link>
  );
}
