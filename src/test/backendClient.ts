import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function isNewApiKey(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

/**
 * A fresh, unauthenticated backend client for integration tests.
 * Session persistence is disabled so tests never pick up a stale session.
 */
export function createAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (isNewApiKey(SUPABASE_KEY) && headers.get("Authorization") === `Bearer ${SUPABASE_KEY}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", SUPABASE_KEY);
        return fetch(input as RequestInfo, { ...init, headers });
      },
    },
  });
}

export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export const RANDOM_UUID = () => crypto.randomUUID();

/** True when the call was rejected by RLS, grants, or an explicit guard. */
export function isRejected(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    msg.includes("forbidden") ||
    msg.includes("permission denied") ||
    msg.includes("row-level security") ||
    msg.includes("violates") ||
    msg.includes("not found") ||
    msg.includes("could not find the function") ||
    error.code === "42501" ||
    error.code === "PGRST301" ||
    error.code === "PGRST202"
  );
}
