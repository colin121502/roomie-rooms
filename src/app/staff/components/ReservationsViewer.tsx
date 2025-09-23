"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Room = { id: string; name: string };
type Row = {
  id: string;
  date: string;                 // YYYY-MM-DD
  status: string;               // BOOKED / CANCELED / ...
  Rooms: { name: string } | null;
  TimeSlots: { starts_at: string; ends_at: string } | null;
  user_id: string | null;       // optional if present
};

function fmt(t?: string | null) {
  return t ? t.slice(0,5) : "";
}

export default function ReservationsViewer() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [roomId, setRoomId] = useState<string>(""); // empty = all rooms
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // initial rooms
  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("Rooms").select("id,name").order("name");
      if (!error) setRooms((data ?? []) as Room[]);
    })();
  }, []);

  // load reservations for filters
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      const supabase = getSupabase();
      let q = supabase
        .from("Reservations")
        .select("id, date, status, user_id, Rooms(name), TimeSlots(starts_at, ends_at)")
        .eq("date", date)
        .neq("status", "CANCELED")
        .order("date", { ascending: true });

      if (roomId) q = q.eq("room_id", roomId);

      const { data, error } = await q;
      if (error) setErr(error.message);
      else setRows((data ?? []) as Row[]);
      setLoading(false);
    };
    load();
  }, [date, roomId]);

  const totals = useMemo(() => ({
    count: rows.length,
  }), [rows]);

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="heading text-lg">Reservations</h3>
        <div className="muted text-sm">{totals.count} total</div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <div>
          <label className="block text-sm mb-1 muted">Date</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1 muted">Room</label>
          <select
            className="select"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="">All rooms</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="muted">Loading…</div>
      ) : err ? (
        <div className="text-red-600 dark:text-red-400">{err}</div>
      ) : rows.length === 0 ? (
        <div className="muted">No reservations for this selection.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="th">
                <th className="text-left">Time</th>
                <th className="text-left">Room</th>
                <th className="text-left">Status</th>
                <th className="text-left">User</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .sort((a, b) => (a.TimeSlots?.starts_at ?? "").localeCompare(b.TimeSlots?.starts_at ?? ""))
                .map(r => (
                  <tr key={r.id} className="border-b" style={{ borderColor: "var(--panel-border)" }}>
                    <td className="py-2">{fmt(r.TimeSlots?.starts_at)}–{fmt(r.TimeSlots?.ends_at)}</td>
                    <td className="py-2">{r.Rooms?.name ?? "Room"}</td>
                    <td className="py-2">{r.status}</td>
                    <td className="py-2">{r.user_id?.slice(0,8) ?? "—"}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}