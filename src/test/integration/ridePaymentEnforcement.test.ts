/**
 * Integration tests: ride payment completion enforcement.
 *
 * A ride payment may only reach `completed` when a verified wallet debit
 * exists for it (enforced by the enforce_ride_payment_completion trigger),
 * and unauthenticated callers may not write payment rows at all.
 */
import { describe, it, expect } from "vitest";
import { createAnonClient, isRejected, RANDOM_UUID } from "./../backendClient";

const supabase = createAnonClient();

describe("ride payment completion enforcement", () => {
  it("blocks anonymous inserts into ride_payments", async () => {
    const { error } = await supabase.from("ride_payments").insert({
      ride_id: RANDOM_UUID(),
      payer_id: RANDOM_UUID(),
      amount: 100,
      payment_method: "cash",
      status: "completed",
    });
    expect(error).not.toBeNull();
    expect(isRejected(error)).toBe(true);
  });

  it("blocks anonymous attempts to flip a payment to completed", async () => {
    const { data, error } = await supabase
      .from("ride_payments")
      .update({ status: "completed" })
      .neq("status", "completed")
      .select();
    expect(error ? isRejected(error) : data?.length === 0).toBe(true);
  });

  it("does not expose ride payment rows to anonymous callers", async () => {
    const { data, error } = await supabase.from("ride_payments").select("*").limit(5);
    expect(error ? isRejected(error) : data?.length === 0).toBe(true);
  });

  it("blocks anonymous writes to rides.payment_status", async () => {
    const { data, error } = await supabase
      .from("rides")
      .update({ payment_status: "completed" })
      .neq("payment_status", "completed")
      .select();
    expect(error ? isRejected(error) : data?.length === 0).toBe(true);
  });

  it("blocks anonymous driver earnings writes", async () => {
    const { error } = await supabase.from("driver_earnings").insert({
      driver_id: RANDOM_UUID(),
      amount: 500,
      type: "ride",
      status: "paid",
    });
    expect(error).not.toBeNull();
    expect(isRejected(error)).toBe(true);
  });
});
