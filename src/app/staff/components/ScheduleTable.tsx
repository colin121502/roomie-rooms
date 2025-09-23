"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

type Room = { id: string; name: string };
type Schedule = {
  id: string;
  room_id: string | null;      // null = global
  day_of_week: number;         // 0..6 (Mon..Sun)
  open_time: string;           // "HH:MM:SS"
  close_time: string;          // "HH:MM:SS"
  is_closed: boolean;
};

const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function fmt(t: string) {
  // "08:00:00" -> "08:00"
  return t?.slice(0,5);
}

export default function ScheduleTable() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      const supabase = getSupabase();

      const [rRooms, rSched] = await Promise.all([
        supabase.from("Rooms").select("id,name").order("name"),
        supabase.from("Schedules")
          .select("id,room_id,day_of_week,open_time,close_time,is_closed")
          .order("day_of_week")
      ]);

      if (rRooms.error) setErr(rRooms.error.message);
      else setRooms((rRooms.data ?? []) as Room[]);

      if (rSched.error) setErr(rSched.error.message);
      else setSchedules((rSched.data ?? []) as Schedule[]);

      setLoading(false);
    };
    load();
  }, []);

  // bucket schedules by scope (global vs room)
  const { globalByDay, perRoom } = useMemo(() => {
    const global = new Map<number, Schedule>();
    const roomMap = new Map<string, Map<number, Schedule>>();

    for (const s of schedules) {
      if (s.room_id == null) {
        global.set(s.day_of_week, s);
      } else {
        if (!roomMap.has(s.room_id)) roomMap.set(s.room_id, new Map());
        roomMap.get(s.room_id)!.set(s.day_of_week, s);
      }
    }
    return { globalByDay: global, perRoom: roomMap };
  }, [schedules]);

  if (loading) return <div className="muted">Loading schedules…</div>;
  if (err) return <div className="text-red-600 dark:text-red-400">{err}</div>;

  const renderRow = (label: string, daysMap: Map<number, Schedule> | null) => (
    <tr key={label} className="border-b" style={{borderColor: "var(--panel-border)"}}>
      <th className="py-2 text-left font-medium">{label}</th>
      {DAY_LABELS.map((_, i) => {
        const s = daysMap?.get(i);
        let text: string;
        if (!s) {
          text = "—";
        } else if (s.is_closed) {
          text = "Closed";
        } else {
          text = `${fmt(s.open_time)}–${fmt(s.close_time)}`;
        }
        return <td key={i} className="py-2">{text}</td>;
      })}
    </tr>
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="heading text-lg">Schedules</h3>
        <p className="muted text-xs">Defaults are 08:00–22:00 (1-hr slots)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="th">
              <th className="text-left">Scope / Room</th>
              {DAY_LABELS.map((d) => (<th key={d} className="text-left">{d}</th>))}
            </tr>
          </thead>
          <tbody>
            {renderRow("Global (all rooms)", globalByDay)}
            {rooms.map((r) => {
              const days = perRoom.get(r.id) ?? null;
              return renderRow(r.name, days);
            })}
          </tbody>
        </table>
      </div>

      <p className="muted mt-3 text-sm">
        Rooms without an override use the <strong>Global</strong> hours.  
        Add per-room overrides later (edit UI coming next).
      </p>
    </div>
  );
}