// Unit tests for tenant-timezone formatting (Phase 3 P0 #2).
//
// Every dashboard formatter takes the tenant's IANA timezone explicitly; an
// omitted timezone means the app default (Asia/Jakarta) — never the server's
// runtime zone. Each test below formats ONE fixed instant under zones with
// different offsets (and, for the key case, different calendar dates), so the
// assertions hold no matter which TZ the machine running them happens to use.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatDate, formatDateTime, formatTime, timeAgo, dayShort } from "./format";
import { DEFAULT_TIMEZONE } from "./timezone";

const WIB = "Asia/Jakarta"; // fixed UTC+7, no DST
const NY = "America/New_York";
const HST = "Pacific/Honolulu"; // fixed UTC-10, no DST

// One instant, three local calendars:
//   Asia/Jakarta     → 2026-08-18 00:30 WIB   (next day!)
//   America/New_York → 2026-08-17 13:30 EDT
//   Pacific/Honolulu → 2026-08-17 07:30 HST
const INSTANT = new Date("2026-08-17T17:30:00Z");

describe("formatDate with a tenant timezone", () => {
  it("renders the tenant's calendar date, not the server's", () => {
    // Jakarta has already rolled to Aug 18 — UTC/server-tz code would print "17".
    assert.equal(formatDate(INSTANT, WIB), "18 Agu 2026");
    assert.equal(formatDate(INSTANT, NY), "17 Agu 2026");
  });

  it("defaults to the app timezone when none is passed", () => {
    assert.equal(formatDate(INSTANT), formatDate(INSTANT, DEFAULT_TIMEZONE));
  });
});

describe("formatTime with a tenant timezone", () => {
  it("renders the clock time in the tenant's zone as HH:MM", () => {
    assert.equal(formatTime(INSTANT, WIB), "00:30");
    assert.equal(formatTime(INSTANT, NY), "13:30");
    assert.equal(formatTime(INSTANT, HST), "07:30");
  });

  it("renders midnight as 00:xx (h23), never 24:xx", () => {
    // 17:00Z + 7 = exactly midnight WIB on Aug 18.
    assert.equal(formatTime(new Date("2026-08-17T17:00:00Z"), WIB), "00:00");
  });

  it("follows the zone's DST offset", () => {
    assert.equal(formatTime(new Date("2026-01-15T12:00:00Z"), NY), "07:00"); // EST, UTC-5
    assert.equal(formatTime(new Date("2026-07-15T12:00:00Z"), NY), "08:00"); // EDT, UTC-4
  });

  it("defaults to the app timezone when none is passed", () => {
    assert.equal(formatTime(INSTANT), formatTime(INSTANT, DEFAULT_TIMEZONE));
  });
});

describe("formatDateTime with a tenant timezone", () => {
  it("shows each tenant's own date and clock time for the same instant", () => {
    const jakarta = formatDateTime(INSTANT, WIB);
    const honolulu = formatDateTime(INSTANT, HST);
    // Jakarta's side of the date line: Aug 18 at 00:30.
    assert.match(jakarta, /18 Agu/);
    assert.match(jakarta, /00[.:]30/);
    // Honolulu is still on Aug 17 at 07:30.
    assert.match(honolulu, /17 Agu/);
    assert.match(honolulu, /07[.:]30/);
    assert.notEqual(jakarta, honolulu);
  });
});

describe("dayShort with a tenant timezone", () => {
  it("the same instant falls on different weekdays in different zones", () => {
    // Tue Aug 18 WIB vs Mon Aug 17 HST.
    assert.equal(dayShort(INSTANT, WIB), "Sel");
    assert.equal(dayShort(INSTANT, HST), "Sen");
  });

  it("defaults to the app timezone when none is passed", () => {
    assert.equal(dayShort(INSTANT), dayShort(INSTANT, DEFAULT_TIMEZONE));
  });
});

describe("timeAgo relative branches and tenant fallback", () => {
  it("uses relative units for fresh timestamps (timezone-independent)", () => {
    assert.equal(timeAgo(new Date(Date.now() - 5_000)), "baru saja");
    assert.equal(timeAgo(new Date(Date.now() - 10 * 60_000)), "10m lalu");
    assert.equal(timeAgo(new Date(Date.now() - 3 * 60 * 60_000)), "3j lalu");
    assert.equal(timeAgo(new Date(Date.now() - 5 * 24 * 60 * 60_000)), "5h lalu");
  });

  it("beyond 30 days it renders the tenant-local date", () => {
    // Fixed instant, safely more than 30 days before any present-day run:
    // 2026-02-01 20:00 UTC = Feb 2 03:00 WIB vs Feb 1 15:00 EST.
    const old = new Date("2026-02-01T20:00:00Z");
    assert.equal(timeAgo(old, WIB), formatDate(old, WIB));
    // The two tenants disagree on the calendar date, so their fallbacks differ.
    assert.notEqual(timeAgo(old, NY), timeAgo(old, WIB));
  });
});
