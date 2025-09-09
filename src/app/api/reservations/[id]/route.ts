import { NextResponse } from "next/server";

type Ctx = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Ctx) {
  // use the id if you want to avoid "unused" warnings
  const { id } = params;
  void id; // (silences no-unused-vars without changing behavior)

  // HTMX will remove the row since we return an empty body.
  return new NextResponse("", {
    headers: { "HX-Trigger": "reservation-cancelled" },
  });
}