import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3002";

// ─── Sprint 3: Product Pages ─────────────────────────────────────────────────

// TC-3.01 | /marketplace — Marketplace page
test.describe("TC-3.01 | Marketplace page loads with asset grid", () => {
  test("Heading, search, filters, and asset cards render", async ({ page }) => {
    await page.goto(`${BASE}/marketplace`);
    await expect(page.locator("h1").first()).toBeVisible();
    // Search input
    await expect(page.getByPlaceholder(/Search/i).first()).toBeVisible();
    // Asset cards
    await expect(page.getByText("MSME Growth Strategy Playbook")).toBeVisible();
    await expect(page.getByText("AI Readiness Assessment Toolkit")).toBeVisible();
  });
});

// TC-3.02 | Marketplace — category filter chips
test.describe("TC-3.02 | Marketplace — category filters render", () => {
  test("All category and sector filter options visible", async ({ page }) => {
    await page.goto(`${BASE}/marketplace`);
    await expect(page.getByRole("button", { name: /^All$/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Strategy/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Agentic AI/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Process Transformation/i }).first()).toBeVisible();
  });
});

// TC-3.03 | Marketplace — asset card contains price and rating
test.describe("TC-3.03 | Marketplace — asset cards show price and rating", () => {
  test("Asset cards display price, rating and format", async ({ page }) => {
    await page.goto(`${BASE}/marketplace`);
    // Prices
    await expect(page.getByText(/₹2,499/i).first()).toBeVisible();
    // Ratings
    await expect(page.getByText("4.8").first()).toBeVisible();
    // Bestseller badges
    await expect(page.getByText(/Bestseller/i).first()).toBeVisible();
  });
});

// TC-3.04 | Marketplace — search filters results
test.describe("TC-3.04 | Marketplace — search filters asset list", () => {
  test("Typing in search box filters visible assets", async ({ page }) => {
    await page.goto(`${BASE}/marketplace`);
    const searchInput = page.getByPlaceholder(/Search/i).first();
    await searchInput.fill("Lean");
    await expect(page.getByText("Lean Manufacturing Implementation Guide")).toBeVisible();
    // MSME Playbook should be filtered out
    await expect(page.getByText("MSME Growth Strategy Playbook")).not.toBeVisible();
  });
});

// TC-3.05 | Marketplace — no overflow at 375px
test.describe("TC-3.05 | Marketplace — responsive at 375px", () => {
  test("Marketplace renders without horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/marketplace`);
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

// TC-3.06 | /assessment — AI Readiness Assessment
test.describe("TC-3.06 | Assessment page loads with first question", () => {
  test("Assessment page shows heading and first question", async ({ page }) => {
    await page.goto(`${BASE}/assessment`);
    await expect(page.locator("h1").first()).toBeVisible();
    // Start the assessment (page begins in intro state)
    await page.getByRole("button", { name: /Start Assessment/i }).click();
    // First question renders
    await expect(page.getByText(/AI Strategy/i).first()).toBeVisible({ timeout: 5000 });
    // Answer options present
    await expect(page.getByText(/No, AI hasn.t been discussed/i)).toBeVisible();
  });
});

// TC-3.07 | Assessment — step navigation
test.describe("TC-3.07 | Assessment — can advance through questions", () => {
  test("Selecting an answer enables Next button, advances to step 2", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto(`${BASE}/assessment`);
    // Start the assessment (page begins in intro state)
    await page.getByRole("button", { name: /Start Assessment/i }).click();
    await expect(page.getByText(/No, AI hasn.t been discussed/i)).toBeVisible({ timeout: 10000 });
    // Click an answer — quiz auto-advances to next question after 300ms
    await page.getByText(/No, AI hasn.t been discussed/i).click();
    // Step 2: Data Readiness question appears automatically
    await expect(page.getByText(/Data Readiness|data infrastructure/i).first()).toBeVisible({ timeout: 5000 });
  });
});

// TC-3.08 | Assessment — progress indicator
test.describe("TC-3.08 | Assessment — progress bar renders", () => {
  test("Progress indicator shows current question number", async ({ page }) => {
    await page.goto(`${BASE}/assessment`);
    // Progress text like "1 of 6" or similar
    await expect(page.getByText(/1\s*\/?\s*[0-9]/i).first()).toBeVisible();
  });
});

// TC-3.09 | /agentic-ai — Agentic AI service page
test.describe("TC-3.09 | Agentic AI service page loads", () => {
  test("Page heading, use cases, and roadmap render", async ({ page }) => {
    await page.goto(`${BASE}/agentic-ai`);
    await expect(page.locator("h1").first()).toBeVisible();
    // Use cases
    await expect(page.getByText(/Intelligent Process Automation/i)).toBeVisible();
    await expect(page.getByText(/Predictive Analytics/i)).toBeVisible();
    // Roadmap phases
    await expect(page.getByText("Assess").first()).toBeVisible();
    await expect(page.getByText("Prioritise").first()).toBeVisible();
    await expect(page.getByText("Build").first()).toBeVisible();
  });
});

// TC-3.10 | Agentic AI — sector tags on use cases
test.describe("TC-3.10 | Agentic AI — sector tags visible on use cases", () => {
  test("Use case cards show sector tags", async ({ page }) => {
    await page.goto(`${BASE}/agentic-ai`);
    await expect(page.getByText("Manufacturing").first()).toBeVisible();
    await expect(page.getByText("Logistics").first()).toBeVisible();
  });
});

// TC-3.11 | /msme-hub — MSME Hub page
test.describe("TC-3.11 | MSME Hub page loads", () => {
  test("MSME Hub shows challenges and sector cards", async ({ page }) => {
    await page.goto(`${BASE}/msme-hub`);
    await expect(page.locator("h1").first()).toBeVisible();
    // Challenge cards
    await expect(page.getByText(/No time for 6-month projects/i)).toBeVisible();
    await expect(page.getByText(/Can.t afford Big 4/i)).toBeVisible();
    // Sector cards
    await expect(page.getByText("Manufacturing").first()).toBeVisible();
    await expect(page.getByText("Retail").first()).toBeVisible();
  });
});

// TC-3.12 | MSME Hub — sector asset counts
test.describe("TC-3.12 | MSME Hub — sector cards show asset counts", () => {
  test("Sector cards show asset counts and top asset names", async ({ page }) => {
    await page.goto(`${BASE}/msme-hub`);
    await expect(page.getByText(/65|52|48/i).first()).toBeVisible();
    await expect(page.getByText(/Lean Implementation Guide/i)).toBeVisible();
  });
});

// TC-3.13 | /login — Login page
test.describe("TC-3.13 | Login page loads with form", () => {
  test("Login page shows heading, email and password fields", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator("h1")).toContainText(/Sign in/i);
    await expect(page.locator('main').locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
  });
});

// TC-3.14 | Login — register and forgot password links
test.describe("TC-3.14 | Login — navigation links present", () => {
  test("Login page has link to register and forgot password", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.getByRole("link", { name: /Create account/i })).toBeVisible();
    await expect(page.getByText(/Forgot password/i)).toBeVisible();
  });
});

// TC-3.15 | /register — Multi-step registration page
test.describe("TC-3.15 | Register page loads with 4-step form", () => {
  test("Registration page shows step 1 with account fields", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page.locator("h1").first()).toBeVisible();
    // Step indicators
    await expect(page.getByText("Account").first()).toBeVisible();
    await expect(page.getByText("Business").first()).toBeVisible();
    // Step 1 fields
    await expect(page.locator('main').locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});

// TC-3.16 | Register — step 1 advances to step 2
test.describe("TC-3.16 | Register — step 1 submits to step 2", () => {
  test("Filling step 1 and clicking Next advances to Business step", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto(`${BASE}/register`);
    // Fill step 1
    await page.locator('main input:not([type="email"]):not([type="password"])').first().fill("Test User");
    await page.locator('main input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').first().fill("Password123!");
    await page.locator('input[type="password"]').last().fill("Password123!");
    // Next button
    const nextBtn = page.getByRole("button", { name: /^Continue$/ });
    await nextBtn.click();
    // Step 2 — Business Details
    await expect(page.getByText(/Business|Company/i).first()).toBeVisible({ timeout: 5000 });
  });
});
