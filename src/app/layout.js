// src/app/layout.js
import "./globals.css";
import NavBar from "../components/NavBar";

export const metadata = {
  title: "Your Site",
  description: "Healthcare tools",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NavBar />
        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
