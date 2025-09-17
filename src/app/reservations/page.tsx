"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  id: string;
  date: string;
  status: string;
  Rooms: { name: string } | null;
  TimeSlots: { starts_at: string; ends_at: string } | null;
};

const FAKE_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function MyReservationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);

      const { data, error } = await supabase
        .from("Reservations")
        .select("id, date, status, Rooms(name), TimeSlots(starts_at, ends_at)")
        .eq("user_id", FAKE_USER_ID)  // swap to auth later
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
    const { error } = await supabase.from("Reservations").update({ status: "CANCELED" }).eq("id", id);
    if (error) alert("Cancel failed: " + error.message);
    else setRows(prev => prev.filter(r => r.id !== id));
    setCancelingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">My Reservations</h1>

      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && rows.length === 0 ? (
        <div className="p-6 rounded-2xl border">No reservations yet.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map(r => (
            <li key={r.id} className="p-4 rounded-2xl border flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">{r.Rooms?.name ?? "Room"}</div>
                <div className="text-sm text-gray-600">
                  {r.date} • {r.TimeSlots?.starts_at}–{r.TimeSlots?.ends_at}
                </div>
              </div>
              <button
                onClick={() => cancelReservation(r.id)}
                disabled={cancelingId === r.id}
                className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-60"
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