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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="site-name">
              Discover Events
            </Link>
            <nav className="nav">
              <Link href="/">Home</Link>
              <Link href="/events">Events</Link>
              <Link href="/artists">Artists</Link>
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
