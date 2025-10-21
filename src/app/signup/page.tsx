"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabaseBrowser";

export default function SignupPage() {
  const supabase = getBrowserClient();
  const router = useRouter();
  const qs = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // 1) Create auth user; stash full_name in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: "user" },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // 2) Only upsert profile if a SESSION exists (email confirmations OFF).
      //    If confirmations are ON, there is no session yet -> skip (RLS would block).
      if (data.session && data.user?.id) {
        const { error: upsertErr } = await supabase
          .from("profiles")
          .upsert(
            { id: data.user.id, full_name: fullName, role: "user" },
            { onConflict: "id" }
          );
        if (upsertErr) {
          setErrorMsg(upsertErr.message);
          return;
        }
      }

      // 3) Sync cookies for SSR routes
      await supabase.auth.getSession();

      // 4) Redirect
      const redirectTo = qs.get("redirect") || "/account";
      if (data.session) {
        router.push(redirectTo);
        router.refresh();
      } else {
        // No session yet => email confirmation flow
        router.push(
          `/login?notice=confirm_email&redirect=${encodeURIComponent(redirectTo)}`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800 dark:text-gray-100">
          Create an Account
        </h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {errorMsg && (
            <p className="text-sm text-red-600 text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg py-2 font-semibold text-white ${
              loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Log In
          </a>
        </p>
      </div>
    </div>
  );
}