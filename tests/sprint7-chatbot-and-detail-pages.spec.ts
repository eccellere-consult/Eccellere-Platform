import { test, expect } from "@playwright/test";

// ─── Chatbot Widget ───────────────────────────────────────────────────────────

test.describe("TC-7.01 Chatbot floating button is visible on homepage", () => {
  test("shows the floating chat button", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /Open chat/i });
    await expect(button).toBeVisible();
  });
});

test.describe("TC-7.02 Chatbot opens and shows welcome message", () => {
  test("opens panel on button click with welcome message", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Open chat/i }).click();
    await expect(page.getByText("Eccellere Advisor")).toBeVisible();
    await expect(page.getByText(/What can I help you with today/i)).toBeVisible();
  });
});

test.describe("TC-7.03 Chatbot responds to user input", () => {
  test("sends a message and receives a response", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Open chat/i }).click();
    const input = page.getByPlaceholder("Ask me anything…");
    await input.fill("What services do you offer?");
    await input.press("Enter");
    // The bot replies with "five core services"
    await expect(page.getByText(/five core services/i).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("TC-7.04 Quick reply buttons visible on first open", () => {
  test("shows quick reply chips after welcome message", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Open chat/i }).click();
    // Quick reply "What services do you offer?" should be a visible button
    const qr = page.getByRole("button", { name: "What services do you offer?" });
    await expect(qr).toBeVisible();
  });
});

test.describe("TC-7.05 Chatbot closes on X button", () => {
  test("dismisses the chatbot panel", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Open chat/i }).click();
    await expect(page.getByText(/What can I help you with today/i)).toBeVisible();
    await page.getByRole("button", { name: /Close chat/i }).click();
    await expect(page.getByText(/What can I help you with today/i)).not.toBeVisible();
  });
});

// ─── Marketplace Asset Detail Pages ──────────────────────────────────────────

test.describe("TC-7.06 Asset detail page loads with title and price", () => {
  test("navigates to /marketplace/msme-growth-strategy-playbook", async ({ page }) => {
    await page.goto("/marketplace/msme-growth-strategy-playbook");
    await expect(page.getByRole("heading", { name: /MSME Growth Strategy Playbook/i })).toBeVisible();
    // Price should be visible — use first() to avoid strict mode violation
    await expect(page.getByText(/₹2,499|₹2499/i).first()).toBeVisible();
  });
});

test.describe("TC-7.07 Asset detail shows What's Included section", () => {
  test("displays the checklist of includes", async ({ page }) => {
    await page.goto("/marketplace/msme-growth-strategy-playbook");
    await expect(page.getByText(/What.s Included|included/i).first()).toBeVisible();
    // At least one checklist item
    await expect(page.locator("ul li").first()).toBeVisible();
  });
});

test.describe("TC-7.08 Asset detail shows related assets", () => {
  test("related assets section renders", async ({ page }) => {
    await page.goto("/marketplace/msme-growth-strategy-playbook");
    await expect(page.getByText(/You may also like|Related/i).first()).toBeVisible();
  });
});

test.describe("TC-7.09 Asset detail Buy Now button is visible", () => {
  test("purchase CTA is present", async ({ page }) => {
    await page.goto("/marketplace/msme-growth-strategy-playbook");
    await expect(page.getByRole("button", { name: /Buy Now|Purchase|Get Access/i })).toBeVisible();
  });
});

// ─── Perspectives Article Detail Pages ───────────────────────────────────────

test.describe("TC-7.10 Article detail page loads", () => {
  test("navigates to /perspectives/why-indian-msmes-should-adopt-agentic-ai", async ({ page }) => {
    await page.goto("/perspectives/why-indian-msmes-should-adopt-agentic-ai");
    await expect(
      page.getByRole("heading", { name: /Why Indian MSMEs Should Adopt Agentic AI/i }).first()
    ).toBeVisible();
  });
});

test.describe("TC-7.11 Article detail shows content blocks", () => {
  test("article body renders paragraphs and headings", async ({ page }) => {
    await page.goto("/perspectives/why-indian-msmes-should-adopt-agentic-ai");
    // Article body should have multiple paragraphs
    await expect(page.locator("p").first()).toBeVisible();
    // At least one h2 in the body (content headings)
    await expect(page.locator("h2").first()).toBeVisible();
  });
});

test.describe("TC-7.12 Article detail shows related articles", () => {
  test("related articles section renders", async ({ page }) => {
    await page.goto("/perspectives/why-indian-msmes-should-adopt-agentic-ai");
    await expect(page.getByText(/Related perspectives/i)).toBeVisible();
  });
});

// ─── Navigation from list pages ──────────────────────────────────────────────

test.describe("TC-7.13 Marketplace list card links use slug URLs", () => {
  test("asset card href contains a slug (not a bare integer)", async ({ page }) => {
    await page.goto("/marketplace");
    // Links should go to /marketplace/<slug> — slugs contain hyphens
    const links = await page.locator('a[href^="/marketplace/"]').all();
    expect(links.length).toBeGreaterThan(0);
    for (const link of links.slice(0, 3)) {
      const href = await link.getAttribute("href");
      // Slug must be more than a single integer
      expect(href).toMatch(/\/marketplace\/[a-z][a-z0-9-]+/);
    }
  });
});

test.describe("TC-7.14 Perspectives list card links use slug URLs", () => {
  test("article card href contains a slug (not a bare integer)", async ({ page }) => {
    await page.goto("/perspectives");
    const links = await page.locator('a[href^="/perspectives/"]').all();
    expect(links.length).toBeGreaterThan(0);
    for (const link of links.slice(0, 3)) {
      const href = await link.getAttribute("href");
      expect(href).toMatch(/\/perspectives\/[a-z0-9][a-z0-9-]+/);
    }
  });
});

test.describe("TC-7.15 Marketplace list card navigates to correct detail page", () => {
  test("clicking first asset card lands on its detail page", async ({ page }) => {
    await page.goto("/marketplace");
    const firstCard = page.locator('a[href^="/marketplace/"]').first();
    const href = await firstCard.getAttribute("href");
    await firstCard.click();
    await expect(page).toHaveURL(href!);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});

test.describe("TC-7.16 Perspectives list card navigates to correct article page", () => {
  test("clicking first article card lands on its detail page", async ({ page }) => {
    await page.goto("/perspectives");
    const firstCard = page.locator('a[href^="/perspectives/"]').first();
    const href = await firstCard.getAttribute("href");
    await firstCard.click();
    await expect(page).toHaveURL(href!);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
