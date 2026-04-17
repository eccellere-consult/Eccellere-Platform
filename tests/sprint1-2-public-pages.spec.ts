import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3002";

// ─── Sprint 1: Foundation — Homepage ────────────────────────────────────────

// TC-1.01 | / — Homepage hero and header
test.describe("TC-1.01 | Homepage loads with hero and header", () => {
  test("Header logo, nav links, and hero heading visible", async ({ page }) => {
    await page.goto(`${BASE}/`);
    // Header brand
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
    // Nav links
    await expect(page.getByRole("link", { name: /What We Do/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Marketplace/i }).first()).toBeVisible();
    // Hero heading present
    await expect(page.locator("h1").first()).toBeVisible();
    // Primary CTA in hero
    await expect(page.getByRole("link", { name: /Talk to Us/i }).first()).toBeVisible();
  });
});

// TC-1.02 | Homepage — trust bar
test.describe("TC-1.02 | Homepage trust bar renders", () => {
  test("Trust bar with metrics is visible below hero", async ({ page }) => {
    await page.goto(`${BASE}/`);
    // Key trust metrics from TrustBar component
    await expect(page.getByText(/MSMEs/i).first()).toBeVisible();
    await expect(page.getByText(/frameworks/i).first()).toBeVisible();
  });
});

// TC-1.03 | Homepage — value proposition section
test.describe("TC-1.03 | Homepage value proposition section", () => {
  test("Why Eccellere section renders with feature points", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByText(/Outcomes Over Outputs|Why Eccellere|Eccellere/i).first()).toBeVisible();
  });
});

// TC-1.04 | Homepage — featured services section
test.describe("TC-1.04 | Homepage featured services", () => {
  test("Featured services section shows service cards", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByText(/Agentic AI/i).first()).toBeVisible();
    await expect(page.getByText(/Strategy/i).first()).toBeVisible();
  });
});

// TC-1.05 | Homepage — featured marketplace section
test.describe("TC-1.05 | Homepage featured marketplace", () => {
  test("Marketplace preview section visible with asset cards", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByText(/MSME Growth Strategy Playbook/i)).toBeVisible();
  });
});

// TC-1.06 | Homepage — Perspectives section
test.describe("TC-1.06 | Homepage perspectives section", () => {
  test("Perspectives section shows article cards", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByText(/Perspectives/i).first()).toBeVisible();
  });
});

// TC-1.07 | Homepage — footer renders
test.describe("TC-1.07 | Homepage footer", () => {
  test("Footer renders with company name and links", async ({ page }) => {
    await page.goto(`${BASE}/`);
    // Footer should contain Eccellere brand and contact info
    await expect(page.getByRole('contentinfo').getByText(/Eccellere/i).first()).toBeVisible();
    await expect(page.getByText(/contact@eccellere.in/i)).toBeVisible();
  });
});

// TC-1.08 | Homepage — no horizontal overflow at 375px
test.describe("TC-1.08 | Homepage responsive — no overflow at 375px", () => {
  test("Homepage renders without horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/`);
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

// ─── Sprint 2: Marketing Pages ───────────────────────────────────────────────

// TC-2.01 | /about — About page
test.describe("TC-2.01 | About page loads", () => {
  test("About page hero heading and values section visible", async ({ page }) => {
    await page.goto(`${BASE}/about`);
    await expect(page.locator("h1")).toContainText(/Consulting reimagined/i);
    await expect(page.getByText(/63 million MSMEs/i)).toBeVisible();
    // Values section
    await expect(page.getByText(/Outcomes Over Outputs/i)).toBeVisible();
    await expect(page.getByText(/Built for India/i)).toBeVisible();
  });
});

// TC-2.02 | About — team/values section
test.describe("TC-2.02 | About — all 6 values render", () => {
  test("All 6 company values are visible", async ({ page }) => {
    await page.goto(`${BASE}/about`);
    await expect(page.getByText(/Specialists, Not Generalists/i)).toBeVisible();
    await expect(page.getByText(/AI as an Accelerator/i)).toBeVisible();
    await expect(page.getByText(/Transparent & Modular/i)).toBeVisible();
    await expect(page.getByText(/Knowledge Compounding/i)).toBeVisible();
  });
});

// TC-2.03 | About — CTA links present
test.describe("TC-2.03 | About — CTA links render", () => {
  test("About page has links to marketplace and contact", async ({ page }) => {
    await page.goto(`${BASE}/about`);
    await expect(page.getByRole("link", { name: /Take AI Assessment/i }).first()).toBeVisible();
  });
});

// TC-2.04 | /services — Services page
test.describe("TC-2.04 | Services page loads with all services", () => {
  test("Services page shows heading and 5 service cards", async ({ page }) => {
    await page.goto(`${BASE}/services`);
    await expect(page.locator("h1").first()).toBeVisible();
    // 5 services from the page
    await expect(page.getByText("Agentic AI").first()).toBeVisible();
    await expect(page.getByText("Strategy").first()).toBeVisible();
    await expect(page.getByText("Process Transformation").first()).toBeVisible();
    await expect(page.getByText("Digital").first()).toBeVisible();
  });
});

// TC-2.05 | Services — capability lists
test.describe("TC-2.05 | Services — agentic AI capabilities listed", () => {
  test("Agentic AI service shows capability bullet points", async ({ page }) => {
    await page.goto(`${BASE}/services`);
    await expect(page.getByText(/AI Readiness Assessment/i).first()).toBeVisible();
    await expect(page.getByText(/Agentic Workflow/i).first()).toBeVisible();
  });
});

// TC-2.06 | /contact — Contact page
test.describe("TC-2.06 | Contact page loads with form", () => {
  test("Contact page heading and form fields visible", async ({ page }) => {
    await page.goto(`${BASE}/contact`);
    await expect(page.locator("h1")).toContainText(/Let.s talk/i);
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});

// TC-2.07 | Contact — inquiry type options
test.describe("TC-2.07 | Contact — inquiry type buttons render", () => {
  test("4 inquiry type buttons visible", async ({ page }) => {
    await page.goto(`${BASE}/contact`);
    const inquirySelect = page.locator('select[name="inquiryType"]');
    await expect(inquirySelect).toBeVisible();
    await expect(page.locator('select[name="inquiryType"] option[value="book-call"]')).toBeAttached();
    await expect(page.locator('select[name="inquiryType"] option[value="get-quote"]')).toBeAttached();
    await expect(page.locator('select[name="inquiryType"] option[value="partner"]')).toBeAttached();
    await expect(page.locator('select[name="inquiryType"] option[value="general"]')).toBeAttached();
  });
});

// TC-2.08 | Contact — office location info
test.describe("TC-2.08 | Contact — office info renders", () => {
  test("Office address and contact details visible", async ({ page }) => {
    await page.goto(`${BASE}/contact`);
    await expect(page.locator('main').getByText(/Bengaluru/i)).toBeVisible();
    await expect(page.locator('main').getByText(/hello@eccellere.in/i)).toBeVisible();
  });
});

// TC-2.09 | /perspectives — Perspectives blog page
test.describe("TC-2.09 | Perspectives page loads with articles", () => {
  test("Perspectives heading, search, and article cards visible", async ({ page }) => {
    await page.goto(`${BASE}/perspectives`);
    await expect(page.locator("h1").first()).toBeVisible();
    // Search input
    await expect(page.getByPlaceholder(/Search articles/i)).toBeVisible();
    // Featured article
    await expect(page.getByText(/Why Indian MSMEs Should Adopt Agentic AI/i)).toBeVisible();
  });
});

// TC-2.10 | Perspectives — category filter chips
test.describe("TC-2.10 | Perspectives — category filters render", () => {
  test("All category filter chips visible", async ({ page }) => {
    await page.goto(`${BASE}/perspectives`);
    await expect(page.getByRole("button", { name: /^All$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Strategy/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Manufacturing/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Agentic AI/i }).first()).toBeVisible();
  });
});

// TC-2.11 | Perspectives — article cards show metadata
test.describe("TC-2.11 | Perspectives — article metadata visible", () => {
  test("Articles show author, date, and read time", async ({ page }) => {
    await page.goto(`${BASE}/perspectives`);
    await expect(page.getByText(/Eccellere Research/i).first()).toBeVisible();
    await expect(page.getByText(/min read/i).first()).toBeVisible();
  });
});
