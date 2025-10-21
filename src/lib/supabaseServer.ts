// src/lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export function getServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // We support both Next 13/14 (sync) and Next 15 (Promise-typed)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const store = cookies() as any;
          return store?.get?.(name)?.value;
        },
        set(_name: string, _value: string, _options?: CookieOptions) {
          // no-op (middleware sets cookies on the response)
        },
        remove(_name: string, _options?: CookieOptions) {
          // no-op
        },
      },
    }
  );
}