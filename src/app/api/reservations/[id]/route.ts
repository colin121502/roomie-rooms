import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const html = ""; // HTMX will replace the row with this (removes it)
  const headers = { "HX-Trigger": "reservation-cancelled" };
  return new NextResponse(html, { headers });
}