// Unit tests for the timezone day-boundary helpers (Revisi §6).
//
// Business-day filtering must interpret "hari" in the tenant's timezone
// (Agency.timezone, default Asia/Jakarta) while the database stores UTC —
// these lock the exact UTC instants for the boundaries the services use.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TIMEZONE,
  normalizeTimezone,
  dayStartInTz,
  dayEndInTz,
  daysAgoStartInTz,
  dateKeyInTz,
  parseDateKeyInTz,
  shiftDateKey,
  startOfWeekInTz,
  monthStartInTz,
} from "./timezone";

const WIB = "Asia/Jakarta"; // fixed UTC+7, no DST

describe("normalizeTimezone", () => {
  it("passes through a valid IANA zone", () => {
    assert.equal(normalizeTimezone("America/New_York"), "America/New_York");
    assert.equal(normalizeTimezone(WIB), WIB);
  });

  it("falls back to Asia/Jakarta on null/undefined/empty", () => {
    assert.equal(normalizeTimezone(null), DEFAULT_TIMEZONE);
    assert.equal(normalizeTimezone(undefined), DEFAULT_TIMEZONE);
    assert.equal(normalizeTimezone(""), DEFAULT_TIMEZONE);
  });

  it("falls back to Asia/Jakarta on an invalid zone", () => {
    assert.equal(normalizeTimezone("Not/AZone"), DEFAULT_TIMEZONE);
    assert.equal(normalizeTimezone("UTC+7"), DEFAULT_TIMEZONE);
  });
});

describe("dayStartInTz (Asia/Jakarta, UTC+7)", () => {
  it("23:59 WIB stays inside that local day (boundary just before midnight)", () => {
    // 2026-08-16T23:59:59.999Z = 2026-08-17T06:59:59.999 WIB
    assert.equal(
      dayStartInTz(WIB, new Date("2026-08-16T23:59:59.999Z")).toISOString(),
      "2026-08-16T17:00:00.000Z",
    );
  });

  it("00:00 WIB rolls over to the next local day (boundary at midnight)", () => {
    // 2026-08-17T00:00:00Z = 2026-08-17T07:00:00 WIB → day starts 00:00 WIB
    assert.equal(
      dayStartInTz(WIB, new Date("2026-08-17T00:00:00Z")).toISOString(),
      "2026-08-16T17:00:00.000Z",
    );
  });

  it("a UTC afternoon instant belongs to the following WIB calendar day", () => {
    // 2026-08-17T18:00:00Z = 2026-08-18T01:00 WIB → day starts 2026-08-17T17:00Z
    assert.equal(
      dayStartInTz(WIB, new Date("2026-08-17T18:00:00Z")).toISOString(),
      "2026-08-17T17:00:00.000Z",
    );
  });

  it("normalizes an invalid zone to the default instead of failing", () => {
    const ref = new Date("2026-08-17T04:00:00Z");
    assert.equal(
      dayStartInTz("Bad/Zone", ref).toISOString(),
      dayStartInTz(DEFAULT_TIMEZONE, ref).toISOString(),
    );
  });
});

describe("dayEndInTz", () => {
  it("is local 23:59:59.999 — one day plus minus 1ms after day start", () => {
    const ref = new Date("2026-08-17T04:00:00Z");
    const start = dayStartInTz(WIB, ref);
    const end = dayEndInTz(WIB, ref);
    assert.equal(end.getTime() - start.getTime(), 86_400_000 - 1);
    assert.equal(end.toISOString(), "2026-08-17T16:59:59.999Z");
  });

  it("the WIB window is exactly one local day of UTC instants", () => {
    const ref = new Date("2026-08-17T04:00:00Z");
    assert.equal(dayStartInTz(WIB, ref).toISOString(), "2026-08-16T17:00:00.000Z");
    assert.equal(dayEndInTz(WIB, ref).toISOString(), "2026-08-17T16:59:59.999Z");
  });
});

describe("daysAgoStartInTz", () => {
  it("n = 0 equals dayStartInTz", () => {
    const ref = new Date("2026-08-17T04:00:00Z");
    assert.equal(daysAgoStartInTz(WIB, 0, ref).toISOString(), dayStartInTz(WIB, ref).toISOString());
  });

  it("steps back whole calendar days in the local zone", () => {
    const ref = new Date("2026-08-17T04:00:00Z");
    assert.equal(daysAgoStartInTz(WIB, 7, ref).toISOString(), "2026-08-09T17:00:00.000Z");
  });

  it("crosses a month boundary (Aug 17 minus 30 days = Jul 18)", () => {
    const ref = new Date("2026-08-17T04:00:00Z");
    assert.equal(daysAgoStartInTz(WIB, 30, ref).toISOString(), "2026-07-17T17:00:00.000Z");
  });

  it("crosses a year boundary (Jan 3 minus 10 days = Dec 24 of the prior year)", () => {
    const ref = new Date("2026-01-03T02:00:00Z"); // 2026-01-03T09:00 WIB
    assert.equal(daysAgoStartInTz(WIB, 10, ref).toISOString(), "2025-12-23T17:00:00.000Z");
  });
});

describe("DST timezones", () => {
  it("America/New_York day boundaries shift with the UTC offset", () => {
    // Winter (EST, UTC-5): midnight starts at 05:00 UTC
    assert.equal(
      dayStartInTz("America/New_York", new Date("2026-01-15T12:00:00Z")).toISOString(),
      "2026-01-15T05:00:00.000Z",
    );
    // Summer (EDT, UTC-4): midnight starts at 04:00 UTC
    assert.equal(
      dayStartInTz("America/New_York", new Date("2026-07-15T12:00:00Z")).toISOString(),
      "2026-07-15T04:00:00.000Z",
    );
  });

  it("daysAgoStartInTz lands on local midnight across a DST transition", () => {
    // US spring-forward is 2026-03-08 at 02:00 local. Midnight that day is
    // still in EST (UTC-5) → 05:00 UTC, and midnight two days later (Mar 10)
    // is in EDT (UTC-4) → 04:00 UTC. The helper must track the zone's actual
    // offset on the target day, not the current one.
    const ref = new Date("2026-03-10T12:00:00Z");
    assert.equal(daysAgoStartInTz("America/New_York", 0, ref).toISOString(), "2026-03-10T04:00:00.000Z");
    assert.equal(daysAgoStartInTz("America/New_York", 2, ref).toISOString(), "2026-03-08T05:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// Calendar-key helpers — the LIVE schedule grid & URL navigation (Phase 3 P0 #2)
// ---------------------------------------------------------------------------

describe("dateKeyInTz", () => {
  const instant = new Date("2026-08-17T17:30:00Z"); // 00:30 Aug 18 WIB / 13:30 Aug 17 EDT

  it("uses the tenant's calendar date, not UTC or the server's zone", () => {
    // The same instant is a different calendar day in Jakarta vs New York —
    // if this ever returned the server/UTC date it would say "2026-08-17" for both.
    assert.equal(dateKeyInTz(WIB, instant), "2026-08-18");
    assert.equal(dateKeyInTz("America/New_York", instant), "2026-08-17");
  });

  it("pads month and day to two digits", () => {
    assert.equal(dateKeyInTz(WIB, new Date("2026-01-05T02:00:00Z")), "2026-01-05");
  });
});

describe("parseDateKeyInTz", () => {
  it("is exact local midnight of that calendar date", () => {
    assert.equal(
      parseDateKeyInTz(WIB, "2026-08-18")!.toISOString(),
      "2026-08-17T17:00:00.000Z",
    );
  });

  it("round-trips with dateKeyInTz", () => {
    const key = dateKeyInTz(WIB, new Date("2026-03-10T12:34:56Z"));
    assert.equal(dateKeyInTz(WIB, parseDateKeyInTz(WIB, key)!), key);
  });

  it("rejects malformed and impossible keys instead of rolling over", () => {
    for (const bad of ["", "garbage", "2026-8-18", "2026-13-01", "2026-02-30", "2026-04-31"]) {
      assert.equal(parseDateKeyInTz(WIB, bad), null, bad);
    }
  });
});

describe("shiftDateKey", () => {
  it("shifts across month and year boundaries by whole calendar days", () => {
    assert.equal(shiftDateKey("2026-08-31", { days: 1 }), "2026-09-01");
    assert.equal(shiftDateKey("2025-12-31", { days: 1 }), "2026-01-01");
    // NY spring-forward day — as a pure calendar key it shifts like any other.
    assert.equal(shiftDateKey("2026-03-15", { days: -7 }), "2026-03-08");
  });

  it("clamps month-end when shifting months", () => {
    assert.equal(shiftDateKey("2026-01-31", { months: 1 }), "2026-02-28");
    assert.equal(shiftDateKey("2024-01-31", { months: 1 }), "2024-02-29"); // leap year
  });

  it("combines months and days in one shift", () => {
    assert.equal(shiftDateKey("2026-08-23", { months: -1, days: -1 }), "2026-07-22");
  });

  it("rejects invalid keys", () => {
    assert.equal(shiftDateKey("nope", { days: 1 }), null);
    assert.equal(shiftDateKey("2026-02-30", { days: 1 }), null);
  });
});

describe("startOfWeekInTz (Monday-start weeks)", () => {
  it("lands on Monday local midnight of the week containing ref", () => {
    // Wed 2026-08-19 17:00 WIB → Monday 2026-08-17 00:00 WIB
    assert.equal(
      startOfWeekInTz(WIB, new Date("2026-08-19T10:00:00Z")).toISOString(),
      "2026-08-16T17:00:00.000Z",
    );
  });

  it("a Sunday belongs to the week that started the previous Monday", () => {
    // Sun 2026-08-23 19:00 WIB → same Monday
    assert.equal(
      startOfWeekInTz(WIB, new Date("2026-08-23T12:00:00Z")).toISOString(),
      "2026-08-16T17:00:00.000Z",
    );
  });

  it("tracks DST: a post-transition Sunday maps back to a pre-transition EST Monday", () => {
    // Sun 2026-03-08 04:00 EDT (US spring-forward happened at 07:00 UTC that
    // morning) → Monday 2026-03-02 00:00 EST = 05:00 UTC.
    assert.equal(
      startOfWeekInTz("America/New_York", new Date("2026-03-08T08:00:00Z")).toISOString(),
      "2026-03-02T05:00:00.000Z",
    );
  });
});

describe("monthStartInTz", () => {
  it("is local midnight of the 1st of the month containing ref", () => {
    // Aug 19 2026 17:00 WIB → Aug 1 00:00 WIB = Jul 31 17:00 UTC
    assert.equal(
      monthStartInTz(WIB, new Date("2026-08-19T10:00:00Z")).toISOString(),
      "2026-07-31T17:00:00.000Z",
    );
  });

  it("crosses the year boundary correctly", () => {
    // Jan 1 2026 09:00 WIB → Jan 1 00:00 WIB = Dec 31 17:00 UTC
    assert.equal(
      monthStartInTz(WIB, new Date("2026-01-01T02:00:00Z")).toISOString(),
      "2025-12-31T17:00:00.000Z",
    );
  });
});

describe("month grid placement (the LIVE schedule page's exact recipe)", () => {
  it("builds 42 unique keys starting on the Monday of the anchor's grid row", () => {
    const anchor = new Date("2026-08-19T10:00:00Z"); // mid-August 2026 WIB
    const startKey = dateKeyInTz(WIB, startOfWeekInTz(WIB, monthStartInTz(WIB, anchor)));
    // Aug 1 2026 is a Saturday → its week row starts on Monday Jul 27…
    assert.equal(startKey, "2026-07-27");
    const gridKeys = Array.from({ length: 42 }, (_, i) => shiftDateKey(startKey, { days: i })!);
    // …and 42 cells later the grid ends on Sep 6, every cell distinct.
    assert.equal(gridKeys[41], "2026-09-06");
    assert.equal(new Set(gridKeys).size, 42);
    assert.ok(gridKeys.includes("2026-08-01"), "the month's first day must be in the grid");
    assert.ok(gridKeys.includes("2026-08-31"), "the month's last day must be in the grid");
  });
});
