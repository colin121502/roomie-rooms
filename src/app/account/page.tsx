// app/account/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabaseClient";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const supabase = getServerClient(await headers());
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?redirect=/account`);
  }

  return <AccountClient email={session.user.email ?? ""} />;
}