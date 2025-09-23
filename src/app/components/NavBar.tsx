"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/reservations", label: "My Reservations" },
    { href: "/staff", label: "Staff" },
    { href: "/login", label: "Login / Signup" },
  ];

  return (
    <header
      className="
        sticky top-0 z-50 border-b shadow-sm
        text-[color:var(--foreground)]
        bg-[var(--nav-bg)] border-[color:var(--nav-border)]
      "
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link href="/" className="text-xl font-semibold hover:underline">
          Roomie Rooms
        </Link>

        <div className="flex items-center gap-6">
          {/* desktop links */}
          <ul className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* theme toggle */}
          <ThemeToggle />

          {/* mobile button */}
          <button
            className="
              md:hidden rounded-lg px-3 py-1 text-sm
              border border-[color:var(--nav-border)]
              hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]
            "
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle Menu"
          >
            Menu
          </button>
        </div>
      </nav>

      {/* mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-[color:var(--nav-border)] bg-[var(--nav-bg)]">
          <ul className="space-y-2 p-4">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block py-1 text-sm"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <ThemeToggle />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}