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
