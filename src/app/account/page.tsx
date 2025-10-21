// src/app/account/page.tsx
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabaseServer";
import AccountClient from "./AccountClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = getServerClient();

  // Require login
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?redirect=/account`);
  }

  const uid = session.user.id;
  const email = session.user.email ?? "";

  // Load profile (full_name, role)
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", uid)
    .maybeSingle();

  const fullName = profileRow?.full_name ?? session.user.user_metadata?.full_name ?? "";
  const role = (profileRow?.role ??
    session.user.user_metadata?.role ??
    "user") as string;

  // Reservation count (not canceled)
const { count } = await supabase
  .from("Reservations")
  .select("id", { count: "exact", head: true })
  .eq("user_id", uid)
  .neq("status", "CANCELED");

const reservationCount = count ?? 0; // <- ensures it's a number

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      <AccountClient
        uid={uid}
        email={email}
        fullName={fullName}
        role={role}
        reservationCount={reservationCount}
      />
    </div>
  );
}