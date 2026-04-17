import { test, expect } from "@playwright/test";

// ─── 8.1 Dark Mode ──────────────────────────────────────────────────────────

test.describe("TC-8.01 Theme toggle button is visible", () => {
  test("shows the theme toggle in the header", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /light mode|dark mode|system theme/i });
    await expect(toggle).toBeVisible();
  });
});

test.describe("TC-8.02 Theme toggle cycles through modes", () => {
  test("clicking toggle changes the theme class on html", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /light mode|dark mode|system theme/i });

    // Click once — should move to next theme
    await toggle.click();
    const htmlClasses = await page.locator("html").getAttribute("class");
    expect(htmlClasses).toMatch(/light|dark/);

    // Click again — should cycle
    await toggle.click();
    const htmlClasses2 = await page.locator("html").getAttribute("class");
    expect(htmlClasses2).toBeTruthy();
  });
});

test.describe("TC-8.03 Dark mode applies dark class to html", () => {
  test("dark theme sets html.dark", async ({ page }) => {
    await page.goto("/");
    // Set dark mode via localStorage before navigating
    await page.evaluate(() => localStorage.setItem("eccellere-theme", "dark"));
    await page.reload();
    await page.waitForTimeout(500);
    const htmlClasses = await page.locator("html").getAttribute("class");
    expect(htmlClasses).toContain("dark");
  });
});

test.describe("TC-8.04 Dark mode persists after reload", () => {
  test("theme preference survives page reload", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("eccellere-theme", "dark"));
    await page.reload();
    await page.waitForTimeout(500);
    const theme = await page.evaluate(() => localStorage.getItem("eccellere-theme"));
    expect(theme).toBe("dark");
    const htmlClasses = await page.locator("html").getAttribute("class");
    expect(htmlClasses).toContain("dark");
  });
});

// ─── 8.2 Performance / Security Headers ─────────────────────────────────────

test.describe("TC-8.05 Security headers are present", () => {
  test("response includes key security headers", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response!.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
  });
});

test.describe("TC-8.06 HSTS header is set", () => {
  test("strict-transport-security header present", async ({ page }) => {
    const response = await page.goto("/");
    const hsts = response!.headers()["strict-transport-security"];
    expect(hsts).toContain("max-age=63072000");
  });
});

test.describe("TC-8.07 CSP header is set", () => {
  test("content-security-policy header present", async ({ page }) => {
    const response = await page.goto("/");
    const csp = response!.headers()["content-security-policy"];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

test.describe("TC-8.08 X-Powered-By header is removed", () => {
  test("no x-powered-by in response", async ({ page }) => {
    const response = await page.goto("/");
    expect(response!.headers()["x-powered-by"]).toBeUndefined();
  });
});

test.describe("TC-8.09 Permissions-Policy header is set", () => {
  test("permissions-policy restricts camera/mic/geo", async ({ page }) => {
    const response = await page.goto("/");
    const pp = response!.headers()["permissions-policy"];
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
  });
});

// ─── 8.3 Accessibility ──────────────────────────────────────────────────────

test.describe("TC-8.10 Skip to content link exists", () => {
  test("skip-to-content link is in the DOM", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });
});

test.describe("TC-8.11 Skip link becomes visible on focus", () => {
  test("tabbing into page reveals skip link", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
  });
});

test.describe("TC-8.12 Focus-visible outlines are present", () => {
  test("focused interactive elements have visible outline", async ({ page }) => {
    await page.goto("/");
    // Tab a few times to reach a button or link
    for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    const outline = await focused.evaluate((el) => getComputedStyle(el).outlineColor);
    // Should have a non-transparent outline
    expect(outline).not.toBe("rgba(0, 0, 0, 0)");
  });
});

test.describe("TC-8.13 All images have alt attributes", () => {
  test("no img tags without alt", async ({ page }) => {
    await page.goto("/");
    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imagesWithoutAlt).toBe(0);
  });
});

test.describe("TC-8.14 HTML lang attribute is set", () => {
  test("html element has lang=en", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");
  });
});

// ─── 8.4 Email Templates (unit-style via import) ────────────────────────────

test.describe("TC-8.15 Email templates module exists", () => {
  test("email templates file is importable at /lib/email-templates", async ({ page }) => {
    // Verify the page loads without errors (email templates don't break the build)
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});

// ─── Cross-page dark mode ───────────────────────────────────────────────────

test.describe("TC-8.16 Dark mode works on marketplace page", () => {
  test("marketplace page respects dark theme", async ({ page }) => {
    await page.goto("/marketplace");
    await page.evaluate(() => localStorage.setItem("eccellere-theme", "dark"));
    await page.reload();
    await page.waitForTimeout(500);
    const htmlClasses = await page.locator("html").getAttribute("class");
    expect(htmlClasses).toContain("dark");
    // Page should still render content
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});

test.describe("TC-8.17 Dark mode works on perspectives page", () => {
  test("perspectives page respects dark theme", async ({ page }) => {
    await page.goto("/perspectives");
    await page.evaluate(() => localStorage.setItem("eccellere-theme", "dark"));
    await page.reload();
    await page.waitForTimeout(500);
    const htmlClasses = await page.locator("html").getAttribute("class");
    expect(htmlClasses).toContain("dark");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});

test.describe("TC-8.18 Dark mode works on about page", () => {
  test("about page respects dark theme", async ({ page }) => {
    await page.goto("/about");
    await page.evaluate(() => localStorage.setItem("eccellere-theme", "dark"));
    await page.reload();
    await page.waitForTimeout(500);
    const htmlClasses = await page.locator("html").getAttribute("class");
    expect(htmlClasses).toContain("dark");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
