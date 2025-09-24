"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

/** ---------- Types ---------- */
type Row = {
  id: string;
  date: string; // YYYY-MM-DD
  status: string;
  user_id: string;
  Rooms: { name: string } | null;
  TimeSlots: { starts_at: string; ends_at: string } | null;
};

// What Supabase may actually return (relations can be arrays or single objects)
type ApiRow = {
  id: string;
  date: string;
  status: string;
  user_id: string;
  Rooms: { name: string } | { name: string }[] | null;
  TimeSlots:
    | { starts_at: string; ends_at: string }
    | { starts_at: string; ends_at: string }[]
    | null;
};

/** ---------- Helpers ---------- */
const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const todayISO = () => toISODate(new Date());
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : "");

function firstOf<T>(val: T | T[] | null | undefined): T | null {
  if (Array.isArray(val)) return val[0] ?? null;
  return val ?? null;
}

/** ---------- Component ---------- */
export default function ReservationsViewer() {
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // Fetch reservations for the chosen date
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("Reservations")
        .select(
          "id,date,status,user_id, Rooms(name), TimeSlots(starts_at,ends_at)"
        )
        .eq("date", selectedDate)
        .neq("status", "CANCELED")
        .order("timeslot_id", { ascending: true });

      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        const list = (data ?? []) as ReadonlyArray<ApiRow>;
        const normalized: Row[] = list.map((r) => ({
          id: r.id,
          date: r.date,
          status: r.status,
          user_id: r.user_id,
          Rooms: firstOf(r.Rooms),
          TimeSlots: firstOf(r.TimeSlots),
        }));
        setRows(normalized);
      }

      setLoading(false);
    };

    load();
  }, [selectedDate]);

  const prevDay = () => setSelectedDate(toISODate(addDays(new Date(selectedDate), -1)));
  const nextDay = () => setSelectedDate(toISODate(addDays(new Date(selectedDate), 1)));

  /** ---------- UI ---------- */
  return (
    <section className="card">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-3">
        <div>
          <h2 className="heading text-lg">View Reservations</h2>
          <p className="muted text-sm">
            Choose any date to view all reservations, even if none exist.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline text-sm" onClick={prevDay}>
            ← Prev day
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input w-[12rem]"
          />
          <button className="btn-outline text-sm" onClick={nextDay}>
            Next day →
          </button>
        </div>
      </div>

      {err && <div className="mb-3 text-red-600 dark:text-red-400">{err}</div>}

      {loading ? (
        <div className="muted">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="muted">No reservations on {selectedDate}.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Time</th>
                <th className="th">Room</th>
                <th className="th">Status</th>
                <th className="th">User</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="td">
                    {r.TimeSlots
                      ? `${fmtTime(r.TimeSlots.starts_at)}–${fmtTime(
                          r.TimeSlots.ends_at
                        )}`
                      : "—"}
                  </td>
                  <td className="td">{r.Rooms?.name ?? "Room"}</td>
                  <td className="td">{r.status}</td>
                  <td className="td">
                    <span className="muted text-xs">{r.user_id}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}