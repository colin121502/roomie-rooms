import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ✅ Correct signature: context has { params: { id: string } }
export async function DELETE(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  void id; // silence "unused" if needed

  // Empty body so HTMX removes the row, plus a toast trigger
  return new NextResponse("", {
    headers: { "HX-Trigger": "reservation-cancelled" },
  });
}