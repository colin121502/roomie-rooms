/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Browser client
export const getBrowserClient = () => createClient(supabaseUrl, supabaseKey);

// ✅ Backward compatibility alias
export const getSupabase = getBrowserClient;

// ✅ Server client (Next.js 15+ safe)
export const getServerClient = (hdrs: any) => {
  const cookiesIn = parseCookieHeader(hdrs.get("cookie") ?? "");
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookiesIn[name];
      },
      // no-ops here; middleware handles setting cookies
      set(_name: string, _value: string, _options?: CookieOptions) {},
      remove(_name: string, _options?: CookieOptions) {},
    },
  });
};