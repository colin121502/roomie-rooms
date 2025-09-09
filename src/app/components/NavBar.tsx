"use client";

import Link from "next/link";
import { useState } from "react";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/reservations", label: "My Reservations" },
    { href: "/staff", label: "Staff" },
    { href: "/login", label: "Login / Signup" },
  ];

  return (
    <header className="w-full border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link href="/" className="text-xl font-semibold">Roomie Rooms</Link>

        <ul className="hidden gap-6 md:flex">
          {links.map(l => (
            <li key={l.href}>
              <Link href={l.href} className="text-sm hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className="md:hidden rounded border px-3 py-1 text-sm"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle Menu"
        >
          Menu
        </button>
      </nav>

      {open && (
        <ul className="md:hidden space-y-2 border-t p-4">
          {links.map(l => (
            <li key={l.href}>
              <Link href={l.href} className="block py-1 text-sm" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}