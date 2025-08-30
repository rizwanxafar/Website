// src/app/layout.js
import "./globals.css";
import NavBar from "../components/NavBar";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
  variable: "--font-sans", // <-- makes it available to Tailwind
});

export const metadata = {
  title: "Your Site",
  description: "Healthcare tools",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} antialiased`}>
        <NavBar />
        <main className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--fg))]">
          {children}
        </main>
      </body>
    </html>
  );
}
