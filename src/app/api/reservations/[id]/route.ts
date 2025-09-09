import { NextResponse } from "next/server";

// Correct signature: context has { params: { id: string } }
export async function DELETE(_req: Request, context: { params: { id: string } }) {
  const { id } = context.params; // use it to avoid "unused" warnings if you like

  // Return empty HTML so HTMX will remove the row; also trigger a toast
  return new NextResponse("", { headers: { "HX-Trigger": "reservation-cancelled" } });
}