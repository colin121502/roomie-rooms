"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

type NavItem = { href: string; label: string };

const LINKS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Book a Room" },
  { href: "/reservations", label: "My Reservations" },
  { href: "/staff", label: "Staff" },
  { href: "/account", label: "Account" },        
  { href: "/login", label: "Login / Signup" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className="
        sticky top-0 z-50 border-b shadow-sm
        text-[color:var(--foreground)]
        bg-[var(--nav-bg)] border-[color:var(--nav-border)]
        backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--nav-bg)_85%,transparent)]
      "
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-4" aria-label="Main">
        {/* Brand */}
        <Link href="/" className="text-xl font-semibold hover:underline">
          Roomie Rooms
        </Link>

        <div className="flex items-center gap-6">
          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-6">
            {LINKS.map((l) => {
              const isActive =
                l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={[
                      "text-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded",
                      isActive ? "font-semibold underline" : "",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Theme toggle (desktop) */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="
              md:hidden rounded-lg px-3 py-1 text-sm
              border border-[color:var(--nav-border)]
              hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
            "
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            Menu
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-[color:var(--nav-border)] bg-[var(--nav-bg)]"
        >
          <ul className="space-y-2 p-4">
            {LINKS.map((l) => (
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