"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

/* ===== Types ===== */
type Room = { id: string; name: string };
type Slot = { id: string; starts_at: string; ends_at: string };
type Reservation = { id: string; room_id: string; timeslot_id: string; date: string; status: string };
type Blackout = {
  date: string; scope: "GLOBAL" | "ROOM"; room_id: string | null;
  is_all_day: boolean; start_time: string | null; end_time: string | null; note: string | null;
};

const FAKE_USER_ID = "00000000-0000-0000-0000-000000000000";

/* ===== Helpers ===== */
const todayISO = () => new Date().toISOString().slice(0, 10);
const parseTimeToMin = (t: string) => { const [hh, mm] = t.split(":").map(Number); return hh * 60 + (mm || 0); };
const timesOverlap = (aS: number, aE: number, bS: number, bE: number) => !(aE <= bS || aS >= bE);

/* ====================================================================== */

export default function BookPage() {
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

  /* ----- compute disabled slots ----- */
  const disabledSlotIds = useMemo(() => {
    if (!roomId) return new Set<string>();
    const reserved = new Set(dayReservations.filter(r => r.room_id === roomId).map(r => r.timeslot_id));
    const relevant = dayBlackouts.filter(b => b.scope === "GLOBAL" || (b.scope === "ROOM" && b.room_id === roomId));
    if (relevant.some(b => b.is_all_day)) return new Set(slots.map(s => s.id));

    const partials = relevant.filter(b => !b.is_all_day && b.start_time && b.end_time);
    if (partials.length === 0) return reserved;

    const out = new Set<string>(reserved);
    for (const s of slots) {
      const sS = parseTimeToMin(s.starts_at), sE = parseTimeToMin(s.ends_at);
      if (partials.some(b => timesOverlap(sS, sE, parseTimeToMin(b.start_time!), parseTimeToMin(b.end_time!)))) {
        out.add(s.id);
      }
    }
    return out;
  }, [roomId, slots, dayReservations, dayBlackouts]);

  /* ----- blackout banner ----- */
  const blackoutBanner = useMemo(() => {
    if (!roomId) return null;
    const relevant = dayBlackouts.filter(b => b.scope === "GLOBAL" || (b.scope === "ROOM" && b.room_id === roomId));
    if (relevant.length === 0) return null;

    const allDay = relevant.find(b => b.is_all_day);
    if (allDay) {
      return {
        kind: "all-day" as const,
        text: allDay.scope === "GLOBAL"
          ? `All rooms are blacked out all day on ${date}${allDay.note ? ` — ${allDay.note}` : ""}.`
          : `This room is blacked out all day on ${date}${allDay.note ? ` — ${allDay.note}` : ""}.`,
      };
    }

    const partials = relevant
      .filter(b => !b.is_all_day && b.start_time && b.end_time)
      .map(b => `${b.start_time!.slice(0, 5)}–${b.end_time!.slice(0, 5)}`);

    return partials.length > 0
      ? { kind: "partial" as const, text: `Some times are blacked out on ${date}: ${partials.join(", ")}.` }
      : null;
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
      user_id: FAKE_USER_ID, room_id: roomId, timeslot_id: timeslotId, date, status: "BOOKED",
    });

    if (error) {
      alert("Booking failed: " + error.message);
    } else {
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
      <h1 className="heading text-3xl font-bold">Book a Room</h1>

      <section className="card">
        {errorMsg && <div className="mb-3 text-red-600 dark:text-red-400">{errorMsg}</div>}
        {loadingStatic ? (
          <div className="muted">Loading rooms & time slots…</div>
        ) : (
          <>
            {/* date + room pickers */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 muted">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1 muted">Room</label>
                <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="select">
                  <option value="" disabled>Select a room…</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* blackout banner */}
            {roomId && blackoutBanner && (
              <div
                className="mt-3 rounded-lg px-3 py-2 text-sm"
                style={{ background: blackoutBanner.kind === "all-day"
                  ? "color-mix(in oklab, var(--foreground) 16%, transparent)"
                  : "color-mix(in oklab, var(--foreground) 10%, transparent)" }}
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
                  {slots.map(s => {
                    const disabled = disabledSlotIds.has(s.id) || bookingId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => book(s.id)}
                        disabled={disabled}
                        className={`btn-outline text-sm w-full ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
              <a className="underline" href="/reservations">My Reservations</a> page.
            </p>
          </>
        )}
      </section>
    </div>
  );
}