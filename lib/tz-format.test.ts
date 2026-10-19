import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatDate, formatDateTime, formatTime, timeAgo, dayShort } from "./format";
import { DEFAULT_TIMEZONE } from "./timezone";

const WIB = "Asia/Jakarta";
const NY = "America/New_York";
const HST = "Pacific/Honolulu";

const INSTANT = new Date("2026-08-17T17:30:00Z");

describe("formatDate with a tenant timezone", () => {
  it("renders the tenant's calendar date, not the server's", () => {
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
    assert.equal(formatTime(new Date("2026-08-17T17:00:00Z"), WIB), "00:00");
  });

  it("follows the zone's DST offset", () => {
    assert.equal(formatTime(new Date("2026-01-15T12:00:00Z"), NY), "07:00");
    assert.equal(formatTime(new Date("2026-07-15T12:00:00Z"), NY), "08:00");
  });

  it("defaults to the app timezone when none is passed", () => {
    assert.equal(formatTime(INSTANT), formatTime(INSTANT, DEFAULT_TIMEZONE));
  });
});

describe("formatDateTime with a tenant timezone", () => {
  it("shows each tenant's own date and clock time for the same instant", () => {
    const jakarta = formatDateTime(INSTANT, WIB);
    const honolulu = formatDateTime(INSTANT, HST);

    assert.match(jakarta, /18 Agu/);
    assert.match(jakarta, /00[.:]30/);
    assert.match(honolulu, /17 Agu/);
    assert.match(honolulu, /07[.:]30/);
    assert.notEqual(jakarta, honolulu);
  });
});

describe("dayShort with a tenant timezone", () => {
  it("the same instant falls on different weekdays in different zones", () => {
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
    const old = new Date("2026-02-01T20:00:00Z");
    assert.equal(timeAgo(old, WIB), formatDate(old, WIB));
    assert.notEqual(timeAgo(old, NY), timeAgo(old, WIB));
  });
});
