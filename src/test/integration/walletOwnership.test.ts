/**
 * Integration tests: wallet ownership enforcement.
 *
 * These run against the real backend with an unauthenticated (anon) client.
 * Every wallet mutation path must be closed to callers that do not own the
 * wallet — RLS, table grants and the SECURITY DEFINER guards all get exercised.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createAnonClient, isRejected, RANDOM_UUID } from "../backendClient";

const supabase = createAnonClient();

describe("wallet ownership checks", () => {
  beforeAll(async () => {
    await supabase.auth.signOut();
  });

  it("does not expose any wallet rows to an unauthenticated caller", async () => {
    const { data, error } = await supabase.from("wallets").select("*").limit(5);
    // Either denied outright, or RLS filters everything out.
    expect(error ? isRejected(error) : data?.length === 0).toBe(true);
  });

  it("blocks direct wallet inserts", async () => {
    const { error } = await supabase
      .from("wallets")
      .insert({ user_id: RANDOM_UUID(), balance: 1000, currency: "ZMW" });
    expect(error).not.toBeNull();
    expect(isRejected(error)).toBe(true);
  });

  it("blocks direct balance updates", async () => {
    const { data, error } = await supabase
      .from("wallets")
      .update({ balance: 999999 })
      .neq("balance", -1)
      .select();
    // No rows may ever be updated by an unauthorized caller.
    expect(error ? isRejected(error) : data?.length === 0).toBe(true);
  });

  it("rejects deduct_wallet_funds for a wallet the caller does not own", async () => {
    const { error } = await supabase.rpc("deduct_wallet_funds", {
      p_user_id: RANDOM_UUID(),
      p_amount: 10,
    });
    expect(error).not.toBeNull();
    expect(isRejected(error)).toBe(true);
  });

  it("rejects transfer_wallet_funds when the caller is not the sender", async () => {
    const { error } = await supabase.rpc("transfer_wallet_funds", {
      p_from_user_id: RANDOM_UUID(),
      p_to_user_id: RANDOM_UUID(),
      p_amount: 25,
      p_description: "integration test",
    });
    expect(error).not.toBeNull();
    expect(isRejected(error)).toBe(true);
  });

  it("rejects non-positive transfer amounts", async () => {
    const { error } = await supabase.rpc("transfer_wallet_funds", {
      p_from_user_id: RANDOM_UUID(),
      p_to_user_id: RANDOM_UUID(),
      p_amount: -100,
      p_description: "negative amount",
    });
    expect(error).not.toBeNull();
  });

  it("does not let clients mint balance through add_wallet_funds", async () => {
    const { error } = await supabase.rpc("add_wallet_funds", {
      p_user_id: RANDOM_UUID(),
      p_amount: 5000,
      p_transaction_id: null,
    });
    expect(error).not.toBeNull();
    expect(isRejected(error)).toBe(true);
  });

  it("blocks direct transaction inserts that would fake a credit", async () => {
    const { error } = await supabase.from("transactions").insert({
      user_id: RANDOM_UUID(),
      type: "credit",
      amount: 5000,
      currency: "ZMW",
      status: "completed",
      description: "fake top-up",
    });
    expect(error).not.toBeNull();
    expect(isRejected(error)).toBe(true);
  });
});
