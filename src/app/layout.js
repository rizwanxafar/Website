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
        <main>{children}</main>
      </body>
    </html>
  );
}
