import assert from "node:assert/strict";
import test from "node:test";

import { createSingleFlight } from "./singleFlight.ts";

test("concurrent callers share one in-flight invocation", async () => {
  let calls = 0;
  let resolveProducer;
  const producer = () =>
    new Promise((resolve) => {
      calls++;
      resolveProducer = () => resolve(`token-${calls}`);
    });

  const flight = createSingleFlight(producer);

  // Three concurrent callers — all should observe the same single refresh.
  const p1 = flight();
  const p2 = flight();
  const p3 = flight();

  assert.equal(calls, 1, "producer should only run once for concurrent callers");

  resolveProducer();
  const results = await Promise.all([p1, p2, p3]);

  assert.deepEqual(results, ["token-1", "token-1", "token-1"]);
  assert.equal(calls, 1);
});

test("a subsequent call after settle starts a fresh invocation", async () => {
  let calls = 0;
  const producer = async () => {
    calls++;
    return `token-${calls}`;
  };

  const flight = createSingleFlight(producer);

  const first = await flight();
  assert.equal(first, "token-1");

  const second = await flight();
  assert.equal(second, "token-2", "next call after settle must run producer again");
  assert.equal(calls, 2);
});

test("rejection clears in-flight state so the next call can retry", async () => {
  let calls = 0;
  const producer = async () => {
    calls++;
    if (calls === 1) throw new Error("first attempt fails");
    return "token-recovered";
  };

  const flight = createSingleFlight(producer);

  await assert.rejects(flight(), /first attempt fails/);
  const second = await flight();
  assert.equal(second, "token-recovered");
  assert.equal(calls, 2);
});

test("callers that arrive during the same tick all share the inflight promise", async () => {
  // Regression for CLIENT-018: the old apiClient cleared its refresh state
  // mid-cleanup, so a third concurrent caller arriving between
  // `await refreshPromise` and `refreshPromise = null` would start a fresh
  // POST /auth/refresh. With createSingleFlight, that race is impossible
  // because clearing only happens inside the IIFE's finally, after every
  // awaiter has resumed.
  let calls = 0;
  const producer = async () => {
    calls++;
    // Force a couple of microtask hops so awaiters interleave.
    await Promise.resolve();
    await Promise.resolve();
    return "single-refresh";
  };

  const flight = createSingleFlight(producer);

  const promises = Array.from({ length: 10 }, () => flight());
  const results = await Promise.all(promises);

  assert.equal(calls, 1, "only one refresh should have been issued");
  assert.deepEqual(
    results,
    Array(10).fill("single-refresh"),
    "every caller must observe the same refresh result"
  );
});
