"use client";

import { getBrowserClient } from "@/lib/supabaseClient";

export default function AccountClient({ email }: { email: string }) {
  const supabase = getBrowserClient();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="mt-2">Signed in as: <strong>{email || "…"}</strong></p>
      <button
        onClick={signOut}
        className="mt-6 rounded-xl border px-4 py-2 hover:bg-gray-50"
      >
        Sign out
      </button>
    </main>
  );
}