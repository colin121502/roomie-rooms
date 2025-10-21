"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabaseBrowser";

type Props = {
  uid: string;
  email: string;
  fullName: string;
  reservationCount: number;
  role: string; // 'user' | 'staff' | 'admin' (string for now)
};

export default function AccountClient({
  uid,
  email,
  fullName,
  reservationCount,
  role,
}: Props) {
  const supabase = getBrowserClient();
  const router = useRouter();

  const [name, setName] = useState(fullName ?? "");
  const [pwd, setPwd] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const resetMsgs = () => {
    setMsg(null);
    setErr(null);
  };

  async function saveName() {
    resetMsgs();
    setSavingName(true);

    // Update auth metadata
    const { error: authErr } = await supabase.auth.updateUser({
      data: { full_name: name },
    });

    // Update profiles table too (best-effort)
    const { error: profErr } = await supabase
      .from("profiles")
      .upsert({ id: uid, full_name: name }, { onConflict: "id" });

    setSavingName(false);

    if (authErr || profErr) {
      setErr(authErr?.message ?? profErr?.message ?? "Failed to update name.");
      return;
    }

    setMsg("Name updated");
    router.refresh();
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    resetMsgs();

    if (pwd.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSavingPwd(false);

    if (error) {
      setErr(error.message);
    } else {
      setPwd("");
      setMsg("Password updated");
    }
  }

  async function signOut() {
    resetMsgs();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Info card */}
      <section className="rounded-2xl border bg-white dark:bg-gray-800 p-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold">
            {name?.trim()?.charAt(0)?.toUpperCase() ||
              email?.charAt(0)?.toUpperCase() ||
              "U"}
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Signed in as
            </div>
            <div className="font-medium">{email}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              UID: <code className="break-all">{uid}</code>
            </div>
            <div className="text-xs mt-1">
              Role:{" "}
              <span className="inline-flex items-center rounded-full border px-2 py-[2px] text-xs">
                {role || "user"}
              </span>
            </div>
          </div>
        </div>

        {/* Update name */}
        <div className="mt-6">
          <label className="block text-sm mb-1">Display name</label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className={`rounded-lg px-4 py-2 text-white ${
                savingName ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {savingName ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="rounded-2xl border bg-white dark:bg-gray-800 p-5">
        <h2 className="font-medium mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/reservations"
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            My Reservations
            <span className="ml-2 inline-flex items-center rounded-full border px-2 text-xs">
              {reservationCount}
            </span>
          </Link>

          {(role === "staff" || role === "admin") && (
            <Link
              href="/staff"
              className="rounded-lg border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Staff Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Change password */}
      <section className="rounded-2xl border bg-white dark:bg-gray-800 p-5">
        <h2 className="font-medium mb-3">Change password</h2>
        <form onSubmit={savePassword} className="flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="New password"
          />
          <button
            type="submit"
            disabled={savingPwd}
            className={`rounded-lg px-4 py-2 text-white ${
              savingPwd
                ? "bg-emerald-400"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {savingPwd ? "Updating…" : "Update"}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">At least 8 characters.</p>
      </section>

      {/* Messages + Sign out */}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {msg && <span className="text-emerald-600">{msg}</span>}
          {err && <span className="text-red-600">{err}</span>}
        </div>

        <button
          onClick={signOut}
          className="rounded-lg px-4 py-2 bg-gray-900 text-white hover:bg-black"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}