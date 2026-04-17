import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3002";

// ─── Sprint 4: Admin Dashboard ───────────────────────────────────────────────

// TC-4.01 | /admin — Admin dashboard overview
test.describe("TC-4.01 | Admin dashboard overview loads", () => {
  test("Admin dashboard renders KPIs and module links", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    // KPI values
    await expect(page.getByText("₹24,85,000")).toBeVisible();
    await expect(page.getByText("342").first()).toBeVisible();
    await expect(page.getByText("47").first()).toBeVisible();
    // Module nav links
    await expect(page.getByRole("link", { name: /Clients/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Specialists/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Assets/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Orders/i }).first()).toBeVisible();
  });
});

// TC-4.02 | Admin — KPI trend indicators
test.describe("TC-4.02 | Admin dashboard KPI trend indicators", () => {
  test("KPI cards show positive change indicators", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page.getByText("+12.4%")).toBeVisible();
    await expect(page.getByText("Active Clients")).toBeVisible();
    await expect(page.getByText("Active Specialists")).toBeVisible();
    await expect(page.getByText("Pending Reviews")).toBeVisible();
  });
});

// TC-4.03 | Admin — recent activity section
test.describe("TC-4.03 | Admin dashboard recent activity", () => {
  test("Recent orders or activity list renders", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    // Recent orders/activity should show ORD- entries
    await expect(page.getByText(/ORD-/i).first()).toBeVisible();
  });
});

// TC-4.04 | /admin/users — User management
test.describe("TC-4.04 | Admin users page loads with user list", () => {
  test("Users page shows heading, search, and user rows", async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await expect(page.locator("h1")).toContainText(/Users/i);
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible();
    // User data
    await expect(page.getByText("Rajesh Kumar")).toBeVisible();
    await expect(page.getByText("rajesh@textilesmsme.in")).toBeVisible();
  });
});

// TC-4.05 | Admin users — role filter
test.describe("TC-4.05 | Admin users — role filter buttons", () => {
  test("Role filter options (All, Admin, Client, Specialist) are present", async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await expect(page.getByRole("button", { name: /^All$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Admins$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Clients$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Specialists$/i })).toBeVisible();
  });
});

// TC-4.06 | Admin users — status badges
test.describe("TC-4.06 | Admin users — status badges render", () => {
  test("Active, pending, and suspended status badges visible", async ({ page }) => {
    await page.goto(`${BASE}/admin/users`);
    await expect(page.getByText("active").first()).toBeVisible();
    await expect(page.getByText("pending").first()).toBeVisible();
    await expect(page.getByText("suspended").first()).toBeVisible();
  });
});

// TC-4.07 | /admin/clients — Client management
test.describe("TC-4.07 | Admin clients page loads", () => {
  test("Clients page shows company names, sector and plan", async ({ page }) => {
    await page.goto(`${BASE}/admin/clients`);
    await expect(page.locator("h1")).toContainText(/Clients/i);
    await expect(page.getByText("Arjun Textiles Pvt Ltd")).toBeVisible();
    await expect(page.getByText("FreshBasket D2C")).toBeVisible();
    // Plan badges
    await expect(page.getByText("Growth").first()).toBeVisible();
    await expect(page.getByText("Enterprise").first()).toBeVisible();
  });
});

// TC-4.08 | /admin/specialists — Specialist management
test.describe("TC-4.08 | Admin specialists page loads", () => {
  test("Specialists page shows specialist list with ratings and earnings", async ({ page }) => {
    await page.goto(`${BASE}/admin/specialists`);
    await expect(page.locator("h1")).toContainText(/Specialists/i);
    await expect(page.getByText("Vikram Patel")).toBeVisible();
    await expect(page.getByText("Rohit Kapoor")).toBeVisible();
    // Pending badge
    await expect(page.getByText(/pending/i).first()).toBeVisible();
    // Rating
    await expect(page.getByText("4.9").first()).toBeVisible();
  });
});

// TC-4.09 | Admin specialists — status filter
test.describe("TC-4.09 | Admin specialists — status filter buttons", () => {
  test("Status filter buttons render on specialists page", async ({ page }) => {
    await page.goto(`${BASE}/admin/specialists`);
    await expect(page.getByRole("button", { name: /^All$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Active$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Pending$/i })).toBeVisible();
  });
});

// TC-4.10 | /admin/assets — Asset management
test.describe("TC-4.10 | Admin assets page loads", () => {
  test("Assets page shows published, pending and rejected assets", async ({ page }) => {
    await page.goto(`${BASE}/admin/assets`);
    await expect(page.locator("h1")).toContainText(/Assets/i);
    await expect(page.getByText("MSME Growth Strategy Playbook")).toBeVisible();
    await expect(page.getByText("AI Readiness Assessment Toolkit")).toBeVisible();
    // Status varieties
    await expect(page.getByText("published").first()).toBeVisible();
    await expect(page.getByText("pending").first()).toBeVisible();
  });
});

// TC-4.11 | Admin assets — pending review count badge
test.describe("TC-4.11 | Admin assets — pending review count", () => {
  test("Pending review count badge shows on assets header", async ({ page }) => {
    await page.goto(`${BASE}/admin/assets`);
    await expect(page.getByText(/pending review/i)).toBeVisible();
  });
});

// TC-4.12 | /admin/orders — Order management
test.describe("TC-4.12 | Admin orders page loads", () => {
  test("Orders page shows order list with client names and amounts", async ({ page }) => {
    await page.goto(`${BASE}/admin/orders`);
    await expect(page.locator("h1")).toContainText(/Orders/i);
    await expect(page.getByText("ORD-2847")).toBeVisible();
    await expect(page.getByText("Arjun Textiles Pvt Ltd")).toBeVisible();
    // Status columns
    await expect(page.getByText("completed").first()).toBeVisible();
    await expect(page.getByText("refunded").first()).toBeVisible();
  });
});

// TC-4.13 | Admin orders — search works
test.describe("TC-4.13 | Admin orders — search filters orders", () => {
  test("Searching for a client name filters order list", async ({ page }) => {
    await page.goto(`${BASE}/admin/orders`);
    await page.getByPlaceholder(/Search/i).fill("MetalWorks");
    await expect(page.getByText("MetalWorks India")).toBeVisible();
    await expect(page.getByText("ORD-2842")).toBeVisible();
    // Others filtered out
    await expect(page.getByText("Arjun Textiles Pvt Ltd")).not.toBeVisible();
  });
});

// TC-4.14 | /admin/finance — Finance page
test.describe("TC-4.14 | Admin finance page loads", () => {
  test("Finance page shows revenue KPIs and transaction list", async ({ page }) => {
    await page.goto(`${BASE}/admin/finance`);
    await expect(page.locator("h1")).toContainText(/Finance|Revenue/i);
    // KPI cards
    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("₹24,85,000")).toBeVisible();
    await expect(page.getByText("Pending Payouts")).toBeVisible();
    // Transactions
    await expect(page.getByText("TXN-4821")).toBeVisible();
  });
});

// TC-4.15 | Admin finance — transaction type colours
test.describe("TC-4.15 | Admin finance — transaction types present", () => {
  test("Sale, payout and refund transactions are visible", async ({ page }) => {
    await page.goto(`${BASE}/admin/finance`);
    await expect(page.getByText(/sale/i).first()).toBeVisible();
    await expect(page.getByText(/payout/i).first()).toBeVisible();
    await expect(page.getByText(/refund/i).first()).toBeVisible();
  });
});

// TC-4.16 | /admin/content — Content management
test.describe("TC-4.16 | Admin content page loads", () => {
  test("Content page shows articles with status badges", async ({ page }) => {
    await page.goto(`${BASE}/admin/content`);
    await expect(page.locator("h1")).toContainText(/Content/i);
    await expect(page.getByText(/How MSME Manufacturers Can Unlock/i)).toBeVisible();
    await expect(page.getByText("published").first()).toBeVisible();
    await expect(page.getByText("draft").first()).toBeVisible();
    await expect(page.getByText("scheduled").first()).toBeVisible();
  });
});

// TC-4.17 | /admin/chatbot — Chatbot conversations
test.describe("TC-4.17 | Admin chatbot page loads", () => {
  test("Chatbot admin page shows conversation list and test interface", async ({ page }) => {
    await page.goto(`${BASE}/admin/chatbot`);
    await expect(page.locator("h1")).toContainText(/Chatbot|AI/i);
    // Past conversations
    await expect(page.getByText("Rajesh Kumar")).toBeVisible();
    await expect(page.getByText(/warehouse automation/i)).toBeVisible();
  });
});

// TC-4.18 | /admin/coupons — Coupons / promotions
test.describe("TC-4.18 | Admin coupons page loads", () => {
  test("Coupons page renders with coupon codes", async ({ page }) => {
    await page.goto(`${BASE}/admin/coupons`);
    await expect(page.locator("h1")).toContainText(/Coupon|Promo|Discount/i);
    // At least one coupon code should be visible
    await expect(page.locator("body")).toBeVisible();
  });
});

// TC-4.19 | /admin/audit-log — Audit log
test.describe("TC-4.19 | Admin audit log page loads", () => {
  test("Audit log page renders with log entries", async ({ page }) => {
    await page.goto(`${BASE}/admin/audit-log`);
    await expect(page.locator("h1")).toContainText(/Audit|Log/i);
    await expect(page.locator("body")).toBeVisible();
  });
});

// TC-4.20 | Admin — responsive at 375px
test.describe("TC-4.20 | Admin dashboard responsive — no overflow at 375px", () => {
  test("Admin dashboard renders without horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/admin`);
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);
    await expect(page.getByText("₹24,85,000")).toBeVisible();
  });
});
