"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

/* ========= Types ========= */
type Room = { id: string; name: string };
type Reservation = {
  id: string;
  date: string;                  // 'YYYY-MM-DD'
  status: string;
  room_id: string;
  timeslot_id: string;
  Rooms?: { name: string } | null;
  TimeSlots?: { starts_at: string; ends_at: string } | null;
};
type Blackout = {
  id: string;
  date: string;                  // 'YYYY-MM-DD'
  scope: "GLOBAL" | "ROOM";
  room_id: string | null;
  is_all_day: boolean;
  start_time: string | null;     // 'HH:MM:SS' when partial
  end_time: string | null;       // 'HH:MM:SS' when partial
  note: string | null;
};

/* ========= Small helpers ========= */
const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : "");
const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const lastOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

/** Build a Mon→Sun month grid (6 rows, 7 cols) that includes leading/trailing days */
function buildMonthGrid(target: Date) {
  const start = firstOfMonth(target);

  // Monday as first column
  const startWeekday = (start.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const gridStart = addDays(start, -startWeekday);

  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i);
    days.push({ date: d, inMonth: d.getMonth() === target.getMonth() });
  }
  return days;
}

export default function StaffPage() {
  /* ======== State ======== */
  const [rooms, setRooms] = useState<Room[]>([]);

  // Reservations viewer
  const [resDate, setResDate] = useState<string>(() => toISODate(new Date()));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingRes, setLoadingRes] = useState<boolean>(true);

  // Blackouts & calendar
  const [monthCursor, setMonthCursor] = useState<Date>(firstOfMonth(new Date()));
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [loadingMonth, setLoadingMonth] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // Add-blackout form
  const [boDate, setBoDate] = useState<string>(() => toISODate(new Date()));
  const [boScope, setBoScope] = useState<"GLOBAL" | "ROOM">("GLOBAL");
  const [boRoomId, setBoRoomId] = useState<string>("");
  const [boAllDay, setBoAllDay] = useState(true);
  const [boStart, setBoStart] = useState<string>("08:00");
  const [boEnd, setBoEnd] = useState<string>("22:00");
  const [boNote, setBoNote] = useState<string>("");

  /* ======== Derived ======== */
  const monthDays = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const monthStartISO = toISODate(firstOfMonth(monthCursor));
  const monthEndISO   = toISODate(lastOfMonth(monthCursor));

  const blackoutsByDate = useMemo(() => {
    const map = new Map<string, Blackout[]>();
    for (const b of blackouts) {
      if (!map.has(b.date)) map.set(b.date, []);
      map.get(b.date)!.push(b);
    }
    return map;
  }, [blackouts]);

  /* ======== Load static (rooms) ======== */
  useEffect(() => {
    const run = async () => {
      const supabase = getSupabase();
      const { data } = await supabase.from("Rooms").select("id,name").order("name");
      setRooms((data ?? []) as Room[]);
    };
    run();
  }, []);

  /* ======== Load reservations for selected date ======== */
  useEffect(() => {
    const run = async () => {
      setLoadingRes(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("Reservations")
        .select("id,date,status,room_id,timeslot_id,Rooms(name),TimeSlots(starts_at,ends_at)")
        .eq("date", resDate)
        .neq("status", "CANCELED")
        .order("timeslot_id", { ascending: true });

      if (error) {
        console.error(error.message);
        setReservations([]);
      } else {
        setReservations((data ?? []) as Reservation[]);
      }
      setLoadingRes(false);
    };
    run();
  }, [resDate]);

  /* ======== Load month blackouts ======== */
  useEffect(() => {
    const run = async () => {
      setLoadingMonth(true);
      setErr(null);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("Blackouts")
        .select("id,date,scope,room_id,is_all_day,start_time,end_time,note")
        .gte("date", monthStartISO)
        .lte("date", monthEndISO)
        .order("date", { ascending: true });

      if (error) setErr(error.message);
      setBlackouts((data ?? []) as Blackout[]);
      setLoadingMonth(false);
    };
    run();
  }, [monthStartISO, monthEndISO]);

  /* ======== Handlers ======== */
  const prevDay = () => setResDate(toISODate(addDays(new Date(resDate), -1)));
  const nextDay = () => setResDate(toISODate(addDays(new Date(resDate), 1)));

  async function addBlackout() {
    if (boScope === "ROOM" && !boRoomId) {
      alert("Pick a room for a room-specific blackout.");
      return;
    }

    const supabase = getSupabase();
    const payload = {
      date: boDate,
      scope: boScope,
      room_id: boScope === "ROOM" ? boRoomId : null,
      is_all_day: boAllDay,
      start_time: boAllDay ? null : `${boStart}:00`,
      end_time:   boAllDay ? null : `${boEnd}:00`,
      note: boNote || null,
    };

    const { error, data } = await supabase.from("Blackouts").insert(payload).select();
    if (error) {
      alert("Add blackout failed: " + error.message);
      return;
    }
    setBlackouts(prev => [...prev, ...(data as any as Blackout[])]);
    setBoNote("");
  }

  async function removeBlackout(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from("Blackouts").delete().eq("id", id);
    if (error) {
      alert("Remove failed: " + error.message);
      return;
    }
    setBlackouts(prev => prev.filter(b => b.id !== id));
  }

  /* ======== UI ======== */
  return (
    <div className="p-6 mx-auto max-w-6xl space-y-8">
      <h1 className="heading text-2xl">Staff Dashboard</h1>

      {/* ===== View Reservations (by date) ===== */}
      <section className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-3">
          <div>
            <h2 className="heading text-lg">View Reservations</h2>
            <p className="muted text-sm">Choose any date to view all reservations, even if none exist.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-outline text-sm" onClick={prevDay}>← Prev day</button>
            <input
              type="date"
              value={resDate}
              onChange={(e) => setResDate(e.target.value)}
              className="input w-[12rem]"
            />
            <button className="btn-outline text-sm" onClick={nextDay}>Next day →</button>
          </div>
        </div>

        {loadingRes ? (
          <div className="muted">Loading…</div>
        ) : reservations.length === 0 ? (
          <div className="muted">No reservations on {resDate}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Time</th>
                  <th className="th">Room</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td className="td">
                      {r.TimeSlots ? `${fmtTime(r.TimeSlots.starts_at)}–${fmtTime(r.TimeSlots.ends_at)}` : "—"}
                    </td>
                    <td className="td">{r.Rooms?.name ?? "Room"}</td>
                    <td className="td">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== Add Blackout ===== */}
      <section className="card">
        <h2 className="heading text-lg mb-4">Add Blackout</h2>

        {err && <div className="mb-3 text-red-600 dark:text-red-400">{err}</div>}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm mb-1 muted">Date</label>
            <input
              type="date"
              value={boDate}
              onChange={(e) => setBoDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 muted">Scope</label>
            <select
              value={boScope}
              onChange={(e) => setBoScope(e.target.value as "GLOBAL" | "ROOM")}
              className="select"
            >
              <option value="GLOBAL">Global (all rooms)</option>
              <option value="ROOM">Specific room</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 muted">Room</label>
            <select
              value={boRoomId}
              onChange={(e) => setBoRoomId(e.target.value)}
              className="select"
              disabled={boScope !== "ROOM"}
            >
              <option value="">Select a room…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 muted">Note (optional)</label>
            <input
              type="text"
              value={boNote}
              onChange={(e) => setBoNote(e.target.value)}
              placeholder="Holiday, maintenance…"
              className="input"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={boAllDay}
              onChange={(e) => setBoAllDay(e.target.checked)}
            />
            <span className="muted">All day</span>
          </label>

          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <div>
              <label className="block text-sm mb-1 muted">Start</label>
              <input
                type="time"
                value={boStart}
                onChange={(e) => setBoStart(e.target.value)}
                className="input"
                disabled={boAllDay}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 muted">End</label>
              <input
                type="time"
                value={boEnd}
                onChange={(e) => setBoEnd(e.target.value)}
                className="input"
                disabled={boAllDay}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button className="btn" onClick={addBlackout}>Add Blackout</button>
        </div>
      </section>

      {/* ===== Blackout Calendar ===== */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="heading text-lg">Blackout Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              className="btn-outline text-sm"
              onClick={() =>
                setMonthCursor(firstOfMonth(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)))
              }
            >
              ← Prev
            </button>
            <div className="muted">
              {monthCursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </div>
            <button
              className="btn-outline text-sm"
              onClick={() =>
                setMonthCursor(firstOfMonth(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)))
              }
            >
              Next →
            </button>
          </div>
        </div>

        {loadingMonth ? (
          <div className="muted">Loading…</div>
        ) : (
          <div className="grid grid-cols-7 gap-3">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} className="muted text-sm">{d}</div>
            ))}

            {monthDays.map(({ date, inMonth }) => {
              const iso = toISODate(date);
              const dayBos = blackoutsByDate.get(iso) ?? [];

              return (
                <div
                  key={iso}
                  className={`rounded-lg border p-2 min-h-28 flex flex-col gap-1 ${inMonth ? "" : "opacity-40"}`}
                  style={{ background: "var(--panel)", borderColor: "var(--panel-border)" }}
                >
                  <div className="text-sm font-medium">{date.getDate()}</div>

                  {dayBos.map((b) => {
                    const labelScope =
                      b.scope === "GLOBAL"
                        ? "Global"
                        : rooms.find(r => r.id === b.room_id)?.name || "Room";
                    const timeLabel = b.is_all_day ? "All day" : `${fmtTime(b.start_time)}–${fmtTime(b.end_time)}`;

                    return (
                      <div key={b.id} className="flex items-start gap-2">
                        <button
                          className="w-full text-left rounded-md px-2 py-1 text-xs leading-5 whitespace-normal break-words"
                          style={{ background: "color-mix(in oklab, var(--foreground) 10%, transparent)" }}
                          title={`${labelScope} • ${timeLabel}${b.note ? ` — ${b.note}` : ""}`}
                        >
                          <div className="whitespace-normal break-words">
                            <strong className="font-medium">{labelScope}</strong>{" • "}{timeLabel}
                            {b.note ? ` — ${b.note}` : ""}
                          </div>
                        </button>
                        <button
                          onClick={() => removeBlackout(b.id)}
                          className="btn-outline text-xs px-2 py-1"
                          title="Remove blackout"
                        >
                          remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}