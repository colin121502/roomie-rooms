import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// In Next 15, params is a Promise in route handlers.
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // await the Promise
  void id; // silence "unused" warning

  return new NextResponse("", {
    headers: { "HX-Trigger": "reservation-cancelled" },
  });
}