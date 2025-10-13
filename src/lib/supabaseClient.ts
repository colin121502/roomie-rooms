/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client
export const getBrowserClient = () => createClient(supabaseUrl, supabaseKey);
export const getSupabase = getBrowserClient; // alias

// Server client (typed; normalize cookies to a record)
export const getServerClient = (hdrs: Pick<Headers, "get">) => {
  const parsed = parseCookieHeader(hdrs.get("cookie") ?? "");

  // normalize to Record<string, string>
  const cookiesIn: Record<string, string> = Array.isArray(parsed)
    ? Object.fromEntries(parsed.map(({ name, value }) => [name, value ?? ""]))
    : (parsed ?? {}) as Record<string, string>;

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookiesIn[name];
      },
      // no-ops here; middleware sets cookies on the response
      set(_name: string, _value: string, _options?: CookieOptions) {},
      remove(_name: string, _options?: CookieOptions) {},
    },
  });
};