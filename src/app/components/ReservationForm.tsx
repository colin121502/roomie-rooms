"use client";
import { useState } from "react";

export default function ReservationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/reservations/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    setMsg(res.ok ? "Looks good! (Saved when backend is enabled.)" : "Error—check fields.");
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="text-sm">
        <span className="block">Room</span>
        <select name="room" className="mt-1 w-full rounded border p-2" required>
          <option value="">Select a room</option>
          <option>Harris 101</option>
          <option>Harris 102</option>
          <option>Library 2F-A</option>
        </select>
      </label>

      <label className="text-sm">
        <span className="block">Date</span>
        <input type="date" name="date" className="mt-1 w-full rounded border p-2" required />
      </label>

      <label className="text-sm">
        <span className="block">Start Time</span>
        <input type="time" name="start" className="mt-1 w-full rounded border p-2" required />
      </label>

      <label className="text-sm">
        <span className="block">Duration (mins)</span>
        <input type="number" name="duration" min={30} step={30} defaultValue={60}
               className="mt-1 w-full rounded border p-2" required />
      </label>

      <label className="text-sm md:col-span-2">
        <span className="block">Notes (optional)</span>
        <input type="text" name="notes" placeholder="Anything the staff should know?"
               className="mt-1 w-full rounded border p-2" />
      </label>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Preview & Validate"}
        </button>
        {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}
      </div>
    </form>
  );
}