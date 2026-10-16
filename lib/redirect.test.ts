import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSafeInternalRedirect, getSafeRedirectUrl } from "./redirect";

describe("open redirect defense and destination sanitization", () => {
  it("accepts valid internal routes", () => {
    assert.equal(isSafeInternalRedirect("/overview"), true);
    assert.equal(isSafeInternalRedirect("/brands"), true);
    assert.equal(isSafeInternalRedirect("/brands/brand-123"), true);
    assert.equal(isSafeInternalRedirect("/campaigns/camp-456/edit"), true);
    assert.equal(isSafeInternalRedirect("/finance/payouts?status=Pending&page=2"), true);
    assert.equal(isSafeInternalRedirect("/reports/export/client?campaignId=123&period=30d"), true);
    assert.equal(isSafeInternalRedirect("/tasks?priority=High#top"), true);
    assert.equal(isSafeInternalRedirect("/"), true);
  });

  it("returns the exact safe destination with query and hash preserved", () => {
    assert.equal(getSafeRedirectUrl("/campaigns/c1?tab=creators#section"), "/campaigns/c1?tab=creators#section");
    assert.equal(getSafeRedirectUrl("/finance/settlements?brandId=b1"), "/finance/settlements?brandId=b1");
  });

  it("rejects protocol-relative URLs", () => {
    assert.equal(isSafeInternalRedirect("//evil.com"), false);
    assert.equal(isSafeInternalRedirect("//evil.com/login"), false);
    assert.equal(getSafeRedirectUrl("//evil.com"), "/overview");
  });

  it("rejects backslash bypasses", () => {
    assert.equal(isSafeInternalRedirect("/\\evil.com"), false);
    assert.equal(isSafeInternalRedirect("\\\\evil.com"), false);
    assert.equal(isSafeInternalRedirect("/\\/evil.com"), false);
    assert.equal(getSafeRedirectUrl("/\\evil.com"), "/overview");
  });

  it("rejects absolute external URLs", () => {
    assert.equal(isSafeInternalRedirect("https://evil.com"), false);
    assert.equal(isSafeInternalRedirect("http://evil.com/steal-token"), false);
    assert.equal(getSafeRedirectUrl("https://evil.com"), "/overview");
  });

  it("rejects javascript: and other dangerous schemes", () => {
    assert.equal(isSafeInternalRedirect("javascript:alert(1)"), false);
    assert.equal(isSafeInternalRedirect("data:text/html,evil"), false);
    assert.equal(isSafeInternalRedirect("vbscript:evil"), false);
    assert.equal(getSafeRedirectUrl("javascript:alert(1)"), "/overview");
  });

  it("rejects CRLF and null characters", () => {
    assert.equal(isSafeInternalRedirect("/overview\r\nSet-Cookie: evil=1"), false);
    assert.equal(isSafeInternalRedirect("/overview\0evil"), false);
    assert.equal(getSafeRedirectUrl("/overview\r\nSet-Cookie: evil=1"), "/overview");
  });

  it("prevents redirect loops back to login", () => {
    assert.equal(isSafeInternalRedirect("/login"), false);
    assert.equal(isSafeInternalRedirect("/login?next=/overview"), false);
    assert.equal(isSafeInternalRedirect("/login/oauth"), false);
    assert.equal(getSafeRedirectUrl("/login"), "/overview");
    assert.equal(getSafeRedirectUrl("/login?next=/overview"), "/overview");
  });

  it("rejects unmapped external routes", () => {
    assert.equal(isSafeInternalRedirect("/external-unmapped-path"), false);
    assert.equal(isSafeInternalRedirect("/admin-panel-hacked"), false);
    assert.equal(getSafeRedirectUrl("/external-unmapped-path"), "/overview");
  });

  it("supports a custom safe default fallback", () => {
    assert.equal(getSafeRedirectUrl(null, "/custom-fallback"), "/custom-fallback");
    assert.equal(getSafeRedirectUrl("", "/custom-fallback"), "/custom-fallback");
    assert.equal(getSafeRedirectUrl(undefined, "/brands"), "/brands");
    assert.equal(getSafeRedirectUrl("https://evil.com", "/brands"), "/brands");
  });
});
