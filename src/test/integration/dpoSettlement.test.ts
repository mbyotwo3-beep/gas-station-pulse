/**
 * Integration tests: DPO settlement rules.
 *
 * Money may only move after the gateway confirms a charge, and only through
 * the server-side edge functions. Unauthenticated callers must never be able
 * to start or settle a charge, and gateway errors must not leak raw details.
 */
import { describe, it, expect } from "vitest";
import { createAnonClient, FUNCTIONS_URL, isRejected, RANDOM_UUID } from "./../backendClient";

const supabase = createAnonClient();
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function callFunction(name: string, body: unknown) {
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, text, json };
}

describe("DPO settlement rules", () => {
  it("refuses to create a service charge without authentication", async () => {
    const { status, json } = await callFunction("dpo-charge-service", {
      rideId: RANDOM_UUID(),
      currency: "USD",
      redirectUrl: "https://example.com/return",
    });
    expect(status).toBe(401);
    expect(String(json.error ?? "")).toMatch(/unauthorized/i);
  });

  it("refuses to verify a payment token without authentication", async () => {
    const { status, json } = await callFunction("dpo-verify-token", { token: "fake-token" });
    expect(status).toBe(401);
    expect(String(json.error ?? "")).toMatch(/unauthorized/i);
  });

  it("never leaks raw gateway credentials or explanations in responses", async () => {
    for (const name of ["dpo-charge-service", "dpo-verify-token", "dpo-create-token"]) {
      const { text } = await callFunction(name, { token: "fake-token", amount: 1 });
      expect(text).not.toMatch(/CompanyToken/i);
      expect(text).not.toMatch(/ResultExplanation/i);
      expect(text).not.toMatch(/3gdirectpay/i);
      expect(text).not.toMatch(/API3G/i);
    }
  });

  it("does not allow clients to settle a service payment directly", async () => {
    const { error } = await supabase.rpc("settle_service_payment", {
      p_user_id: RANDOM_UUID(),
      p_amount: 50,
      p_service_type: "ride",
      p_service_id: RANDOM_UUID(),
      p_reference_id: null,
    });
    expect(error).not.toBeNull();
    expect(isRejected(error)).toBe(true);
  });

  it("does not expose other users' transactions to anonymous callers", async () => {
    const { data, error } = await supabase.from("transactions").select("*").limit(5);
    expect(error ? isRejected(error) : data?.length === 0).toBe(true);
  });
});
