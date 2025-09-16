"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Room = { id: string; name: string };
type Slot = { id: string; starts_at: string; ends_at: string };
type Reservation = { id: string; room_id: string; timeslot_id: string; date: string; status: string };

const FAKE_USER_ID = "00000000-0000-0000-0000-000000000000"; // replace with real auth later

export default function Home() {
  // ------- landing UI only state (none) -------

  // ------- booking state -------
  const [rooms, setRooms] = useState<Room[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [roomId, setRoomId] = useState<string>("");
  const [dayReservations, setDayReservations] = useState<Reservation[]>([]);
  const [loadingStatic, setLoadingStatic] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // initial load: rooms + slots
  useEffect(() => {
    const loadStatic = async () => {
      setLoadingStatic(true);
      setErrorMsg(null);
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

  // load reservations for chosen day
  useEffect(() => {
    const loadDay = async () => {
      const { data, error } = await supabase
        .from("Reservations")
        .select("id,room_id,timeslot_id,date,status")
        .eq("date", date)
        .neq("status", "CANCELED");
      if (!error) setDayReservations((data ?? []) as Reservation[]);
    };
    loadDay();
  }, [date]);

  // which slots are already taken for the selected room?
  const disabledSlotIds = useMemo(() => {
    if (!roomId) return new Set<string>();
    return new Set(dayReservations.filter(r => r.room_id === roomId).map(r => r.timeslot_id));
  }, [dayReservations, roomId]);

  async function book(timeslotId: string) {
    if (!roomId) {
      alert("Pick a room first.");
      return;
    }
    setBookingId(timeslotId);

    // (use auth later) const { data: auth } = await supabase.auth.getUser();
    // const userId = auth.user?.id;
    const userId = FAKE_USER_ID;

    const { error } = await supabase.from("Reservations").insert({
      user_id: userId,
      room_id: roomId,
      timeslot_id: timeslotId,
      date,
      status: "BOOKED",
    });

    if (error) {
      alert("Booking failed: " + error.message);
    } else {
      // refresh day reservations to disable the slot
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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* ====== HERO (your existing content) ====== */}
      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold">Roomie Rooms</h1>
          <h2 className="text-xl text-gray-600 mt-2">Campus Study Room Reservations</h2>

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
            <a href="/reservations" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Get Started
            </a>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Quick Links</h2>
          <ul className="list-disc pl-5 text-sm space-y-2">
            <li><a className="underline" href="/reservations">View your reservations</a></li>
            <li>See available rooms</li>
            <li>Contact staff</li>
          </ul>
        </div>
      </section>

      {/* ====== BOOKING PANEL ====== */}
      <section className="rounded-2xl border p-4">
        <h3 className="text-lg font-semibold mb-3">Book a Room</h3>

        {errorMsg && <div className="mb-3 text-red-600">{errorMsg}</div>}
        {loadingStatic ? (
          <div>Loading rooms & time slots…</div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Room</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                >
                  <option value="" disabled>Select a room…</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 font-medium">Available time slots</div>
              {!roomId ? (
                <div className="text-gray-600">Choose a room to see slots.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map(s => {
                    const disabled = disabledSlotIds.has(s.id) || bookingId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => book(s.id)}
                        disabled={disabled}
                        className={`px-3 py-2 rounded-xl border text-sm ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                      >
                        {s.starts_at}–{s.ends_at}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-3">
              Manage bookings on the <a className="underline" href="/reservations">My Reservations</a> page.
            </p>
          </>
        )}
      </section>
    </div>
  );
}