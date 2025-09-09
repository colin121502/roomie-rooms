import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const required = ["room", "date", "start", "duration"];
  for (const k of required) {
    if (!body[k]) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}