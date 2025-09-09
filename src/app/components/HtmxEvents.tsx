"use client";
import { useEffect } from "react";

export default function HtmxEvents() {
  useEffect(() => {
    function handler() {
      const el = document.getElementById("toast");
      if (el) el.textContent = "Reservation cancelled.";
    }
    document.body.addEventListener("reservation-cancelled", handler as any);
    return () => document.body.removeEventListener("reservation-cancelled", handler as any);
  }, []);
  return null;
}