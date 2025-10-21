"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabaseBrowser";

type Row = {
  id: string;
  date: string;
  status: string;
  Rooms: { name: string } | null;
  TimeSlots: { starts_at: string; ends_at: string } | null;
};

export default function MyReservationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const supabase = getBrowserClient();

      // 1) Get the current user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      // If not logged in, bounce to login and keep deep link
      if (!user) {
        const qs = new URLSearchParams({ redirect: "/reservations" }).toString();
        window.location.href = `/login?${qs}`;
        return;
      }

      // 2) Query this user's reservations
      const { data, error } = await supabase
        .from("Reservations") // adjust to your exact table name/case
        .select(
          "id, date, status, Rooms(name), TimeSlots(starts_at, ends_at)"
        )
        .eq("user_id", user.id)
        .neq("status", "CANCELED")
        .order("date", { ascending: true })
        .returns<Row[]>();

      if (error) setError(error.message);
      else setRows(data ?? []);

      setLoading(false);
    };

    load();
  }, []);

  const cancelReservation = async (id: string) => {
    setCancelingId(id);
    const supabase = getBrowserClient();

    const { error } = await supabase
      .from("Reservations")
      .update({ status: "CANCELED" })
      .eq("id", id);

    if (error) {
      alert("Cancel failed: " + error.message);
    } else {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
    setCancelingId(null);
  };

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="heading text-2xl">My Reservations</h1>

      {loading && (
        <div className="card">
          <div className="muted">Loading…</div>
        </div>
      )}

      {error && (
        <div className="card">
          <div className="text-red-600 dark:text-red-400">{error}</div>
        </div>
      )}

      {!loading && rows.length === 0 ? (
        <div className="card">
          <p className="muted">No reservations yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="card p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {r.Rooms?.name ?? "Room"}
                </div>
                <div className="muted text-sm">
                  {r.date} • {r.TimeSlots?.starts_at}–{r.TimeSlots?.ends_at}
                </div>
              </div>

              <button
                onClick={() => cancelReservation(r.id)}
                disabled={cancelingId === r.id}
                className="btn-outline disabled:opacity-60"
              >
                {cancelingId === r.id ? "Canceling…" : "Cancel"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}