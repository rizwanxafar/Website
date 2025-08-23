// src/app/algorithms/page.js
import Link from "next/link";

export const metadata = {
  title: "Algorithms · ID Northwest",
  description:
    "Quick access to infectious diseases algorithms grouped by Travel-related, Viral Hepatitis, and HIV.",
};

export default function AlgorithmsIndex() {
  return (
    <main className="py-10 sm:py-14">
      {/* Header */}
      <header className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Algorithms
        </h1>
        <p className="mt-2 text-sm sm:text-base text-
