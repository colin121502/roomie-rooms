"use client";
import { useEffect } from "react";

export default function HtmxEvents() {
  useEffect(() => {
    const handler: EventListener = () => {
      const el = document.getElementById("toast");
      if (el) el.textContent = "Reservation cancelled.";
    };

    document.body.addEventListener("reservation-cancelled", handler);
    return () => document.body.removeEventListener("reservation-cancelled", handler);
  }, []);

  return null;
}