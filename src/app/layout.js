import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "ID-Northwest | Clinical OS",
  description: "Infectious Diseases Clinical Operating System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-brand/20 selection:text-brand">
        {children}
      </body>
    </html>
  );
}
