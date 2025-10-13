import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabaseClient";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const supabase = getServerClient(headers());
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?redirect=/account`);
  }

  // (optional) load profile
  // const { data: profile } = await supabase.from("profiles")
  //   .select("full_name").eq("id", session.user.id).single();

  return <AccountClient email={session.user.email ?? ""} />;
}