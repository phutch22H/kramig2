import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Discover Events",
    template: "%s | Discover Events",
  },
  description:
    "Find and explore live events near you. Browse concerts, festivals, theater, sports and more.",
  openGraph: {
    type: "website",
    siteName: "Discover Events",
    title: "Discover Events",
    description:
      "Find and explore live events near you. Browse concerts, festivals, theater, sports and more.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="site-name">
              Discover Events
            </Link>
            <nav className="nav">
              <Link href="/">Home</Link>
              <Link href="/events">Events</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Discover Events. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
