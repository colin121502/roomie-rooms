// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client
export const getBrowserClient = () => createClient(supabaseUrl, supabaseKey);

// Alias to keep older imports working
export const getSupabase = getBrowserClient;

// Server client (for Server Components)
export const getServerClient = (headers: Headers) => {
  const cookiesIn = parseCookieHeader(headers.get("cookie") ?? "");
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookiesIn[name];
      },
      // no-ops here; middleware actually sets cookies on the response
      set(_name: string, _value: string, _options?: CookieOptions) {},
      remove(_name: string, _options?: CookieOptions) {},
    },
  });
};