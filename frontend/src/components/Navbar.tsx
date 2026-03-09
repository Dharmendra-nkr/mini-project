"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Waves } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms & Suites" },
  { href: "/explore", label: "3D Explorer" },
  { href: "/booking", label: "My Booking" },
  { href: "/manager/login", label: "Manager" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full glass-light shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Waves className="h-7 w-7 text-[var(--ocean)] group-hover:text-[var(--gold)] transition-colors" />
          <span className="text-lg font-bold tracking-tight text-[var(--navy)]">
            Grand Meridian
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--gold)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/rooms"
            className="rounded-full bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--gold-light)] hover:text-[var(--navy)] transition-all"
          >
            Book Now
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[var(--navy)]"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-light border-t border-black/5 px-4 py-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-[var(--foreground)] hover:text-[var(--gold)]"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/rooms"
            onClick={() => setOpen(false)}
            className="block w-full text-center rounded-full bg-[var(--gold)] px-5 py-2 text-sm font-semibold text-white"
          >
            Book Now
          </Link>
        </div>
      )}
    </nav>
  );
}
