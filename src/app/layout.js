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
        <main className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-6 py-4">
          {children}
        </main>
      </body>
    </html>
  );
}
