"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

/* ===== Types ===== */
type Room = { id: string; name: string };
type Slot = { id: string; starts_at: string; ends_at: string };
type Reservation = {
  id: string;
  room_id: string;
  timeslot_id: string;
  date: string;            // YYYY-MM-DD
  status: string;
};
type Blackout = {
  date: string;            // YYYY-MM-DD
  scope: "GLOBAL" | "ROOM";
  room_id: string | null;
  is_all_day: boolean;
  start_time: string | null; // HH:MM:SS when partial
  end_time: string | null;   // HH:MM:SS when partial
  note: string | null;
};

const FAKE_USER_ID = "00000000-0000-0000-0000-000000000000";

/* ===== Helpers ===== */
const todayISO = () => new Date().toISOString().slice(0, 10);

const parseTimeToMin = (t: string) => {
  // Accepts "HH:MM" or "HH:MM:SS"
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + (mm || 0);
};

const timesOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  !(aEnd <= bStart || aStart >= bEnd);

/* ====================================================================== */

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [date, setDate] = useState<string>(todayISO());
  const [roomId, setRoomId] = useState<string>("");

  const [dayReservations, setDayReservations] = useState<Reservation[]>([]);
  const [dayBlackouts, setDayBlackouts] = useState<Blackout[]>([]);

  const [loadingStatic, setLoadingStatic] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ----- initial load: rooms + slots ----- */
  useEffect(() => {
    const loadStatic = async () => {
      setLoadingStatic(true);
      setErrorMsg(null);
      const supabase = getSupabase();

      const [rRooms, rSlots] = await Promise.all([
        supabase.from("Rooms").select("id,name").order("name"),
        supabase.from("TimeSlots").select("id,starts_at,ends_at").order("starts_at"),
      ]);

      if (rRooms.error) setErrorMsg(rRooms.error.message);
      else setRooms((rRooms.data ?? []) as Room[]);

      if (rSlots.error) setErrorMsg(rSlots.error.message);
      else setSlots((rSlots.data ?? []) as Slot[]);

      setLoadingStatic(false);
    };
    loadStatic();
  }, []);

  /* ----- load reservations for chosen day ----- */
  useEffect(() => {
    const run = async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("Reservations")
        .select("id,room_id,timeslot_id,date,status")
        .eq("date", date)
        .neq("status", "CANCELED");
      if (error) {
        console.error(error.message);
        setDayReservations([]);
      } else {
        setDayReservations((data ?? []) as Reservation[]);
      }
    };
    run();
  }, [date]);

  /* ----- load blackouts for chosen day ----- */
  useEffect(() => {
    const run = async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("Blackouts")
        .select("date,scope,room_id,is_all_day,start_time,end_time,note")
        .eq("date", date);

      if (error) {
        console.error(error.message);
        setDayBlackouts([]);
      } else {
        setDayBlackouts((data ?? []) as Blackout[]);
      }
    };
    run();
  }, [date]);

  /* ----- compute disabled slots (reservations + blackouts) ----- */
  const disabledSlotIds = useMemo(() => {
    if (!roomId) return new Set<string>();

    // Already reserved for this room on that date
    const reserved = new Set(
      dayReservations.filter((r) => r.room_id === roomId).map((r) => r.timeslot_id)
    );

    // Blackouts affecting this selection:
    const relevantBlackouts = dayBlackouts.filter(
      (b) => b.scope === "GLOBAL" || (b.scope === "ROOM" && b.room_id === roomId)
    );

    // If any all-day blackout applies, everything is disabled
    const anyAllDay = relevantBlackouts.some((b) => b.is_all_day === true);
    if (anyAllDay) {
      return new Set(slots.map((s) => s.id));
    }

    // Otherwise only disable overlapping slots for partial blackouts
    const partials = relevantBlackouts.filter(
      (b) => !b.is_all_day && b.start_time && b.end_time
    );

    if (partials.length === 0) {
      // Only existing reservations disable
      return reserved;
    }

    const out = new Set<string>(reserved);
    for (const s of slots) {
      const sStart = parseTimeToMin(s.starts_at);
      const sEnd = parseTimeToMin(s.ends_at);

      const overlapsAny = partials.some((b) =>
        timesOverlap(sStart, sEnd, parseTimeToMin(b.start_time!), parseTimeToMin(b.end_time!))
      );

      if (overlapsAny) out.add(s.id);
    }
    return out;
  }, [roomId, slots, dayReservations, dayBlackouts]);

  /* ----- banner/heads-up text for blackout state ----- */
  const blackoutBanner = useMemo(() => {
    if (!roomId) return null;

    const relevant = dayBlackouts.filter(
      (b) => b.scope === "GLOBAL" || (b.scope === "ROOM" && b.room_id === roomId)
    );

    if (relevant.length === 0) return null;

    const allDay = relevant.find((b) => b.is_all_day);
    if (allDay) {
      return {
        kind: "all-day" as const,
        text:
          allDay.scope === "GLOBAL"
            ? `All rooms are blacked out all day on ${date}${allDay.note ? ` — ${allDay.note}` : ""}.`
            : `This room is blacked out all day on ${date}${allDay.note ? ` — ${allDay.note}` : ""}.`,
      };
    }

    // Gather partial windows for message:
    const partials = relevant
      .filter((b) => !b.is_all_day && b.start_time && b.end_time)
      .map((b) => `${b.start_time!.slice(0, 5)}–${b.end_time!.slice(0, 5)}`);

    if (partials.length > 0) {
      return {
        kind: "partial" as const,
        text: `Some times are blacked out on ${date}: ${partials.join(", ")}.`,
      };
    }

    return null;
  }, [roomId, dayBlackouts, date]);

  /* ----- booking ----- */
  async function book(timeslotId: string) {
    if (!roomId) {
      alert("Pick a room first.");
      return;
    }
    setBookingId(timeslotId);

    const supabase = getSupabase();
    const { error } = await supabase.from("Reservations").insert({
      user_id: FAKE_USER_ID,
      room_id: roomId,
      timeslot_id: timeslotId,
      date,
      status: "BOOKED",
    });

    if (error) {
      // surfaces DB message (e.g., blackout trigger)
      alert("Booking failed: " + error.message);
    } else {
      // refresh day reservations
      const { data } = await supabase
        .from("Reservations")
        .select("id,room_id,timeslot_id,date,status")
        .eq("date", date)
        .neq("status", "CANCELED");
      setDayReservations((data ?? []) as Reservation[]);
      alert("Booked! See it on the My Reservations page.");
    }
    setBookingId(null);
  }

  /* ============================== UI ============================== */

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* ====== HERO ====== */}
      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h1 className="heading text-4xl font-bold">Roomie Rooms</h1>
          <h2 className="muted text-xl mt-2">Campus Study Room Reservations</h2>

          <p className="mt-6 text-lg">
            Students can easily reserve campus study rooms. Staff can manage schedules, set blackout dates,
            track attendance, and export reports for analysis.
          </p>

          <ul className="mt-6 list-disc pl-6 space-y-2">
            <li>📅 Book and cancel reservations</li>
            <li>🔑 Staff manage schedules and blackout dates</li>
            <li>✅ Track attendance and no-shows</li>
            <li>📊 Export data to CSV</li>
          </ul>

          <div className="mt-8">
            <a href="/reservations" className="btn">
              Get Started
            </a>
          </div>
        </div>

        {/* Quick Links panel */}
        <div className="card">
          <h2 className="heading text-base mb-3">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400"
                href="/reservations"
              >
                View your reservations
              </a>
            </li>
            <li className="muted">See available rooms</li>
            <li className="muted">Contact staff</li>
          </ul>
        </div>
      </section>

      {/* ====== BOOKING PANEL ====== */}
      <section className="card">
        <h3 className="heading text-lg mb-3">Book a Room</h3>

        {errorMsg && <div className="mb-3 text-red-600 dark:text-red-400">{errorMsg}</div>}
        {loadingStatic ? (
          <div className="muted">Loading rooms & time slots…</div>
        ) : (
          <>
            {/* date + room pickers */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 muted">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 muted">Room</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="select"
                >
                  <option value="" disabled>
                    Select a room…
                  </option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* blackout banner */}
            {roomId && blackoutBanner && (
              <div
                className="mt-3 rounded-lg px-3 py-2 text-sm"
                style={{
                  background:
                    blackoutBanner.kind === "all-day"
                      ? "color-mix(in oklab, var(--foreground) 16%, transparent)"
                      : "color-mix(in oklab, var(--foreground) 10%, transparent)",
                }}
              >
                {blackoutBanner.text}
              </div>
            )}

            {/* slot grid */}
            <div className="mt-4">
              <div className="mb-2 font-medium">Available time slots</div>
              {!roomId ? (
                <div className="muted">Choose a room to see slots.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map((s) => {
                    const disabled =
                      disabledSlotIds.has(s.id) || bookingId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => book(s.id)}
                        disabled={disabled}
                        className={`btn-outline text-sm w-full ${
                          disabled ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        title={`${s.starts_at.slice(0, 5)}–${s.ends_at.slice(0, 5)}`}
                      >
                        {s.starts_at.slice(0, 5)}–{s.ends_at.slice(0, 5)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-sm mt-3 muted">
              Manage bookings on the{" "}
              <a className="underline" href="/reservations">
                My Reservations
              </a>{" "}
              page.
            </p>
          </>
        )}
      </section>
    </div>
  );
}