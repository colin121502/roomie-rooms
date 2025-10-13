// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import {
  createServerClient,
  parseCookieHeader,
  serializeCookie,
} from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ For browser/client components
export const getBrowserClient = () => createClient(supabaseUrl, supabaseKey);

// ✅ Alias so older files using "getSupabase" won't break
export const getSupabase = getBrowserClient;

// ✅ For server components or middleware
export const getServerClient = (headers: Headers) => {
  const cookiesIn = parseCookieHeader(headers.get("cookie") ?? "");
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookiesIn[name];
      },
      set(name: string, value: string, options: CookieOptions) {
        // Middleware handles cookie setting automatically
      },
      remove(name: string, options: CookieOptions) {
        // No-op for now
      },
    },
  });
};