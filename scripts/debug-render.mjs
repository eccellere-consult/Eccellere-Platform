import { chromium } from "playwright";

const url = process.argv[2] || "https://eccellere.co.in";
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const errors = [];
const requests = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack ?? ""}`));
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") {
    errors.push(`[console.${m.type()}] ${m.text()}`);
  }
});
page.on("requestfailed", (r) => requests.push(`[FAIL] ${r.url()} :: ${r.failure()?.errorText}`));
page.on("response", (r) => {
  if (r.status() >= 400) requests.push(`[${r.status()}] ${r.url()}`);
});

console.log(`Loading ${url} ...`);
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);

const heroOpacity = await page
  .locator("h1")
  .first()
  .evaluate((el) => getComputedStyle(el).opacity)
  .catch(() => "n/a");

const heroText = await page.locator("h1").first().textContent().catch(() => null);

console.log("\n=== HERO H1 ===");
console.log("opacity:", heroOpacity);
console.log("text:", heroText?.slice(0, 80));

console.log("\n=== ERRORS ===");
console.log(errors.length === 0 ? "(none)" : errors.join("\n"));

console.log("\n=== FAILED REQUESTS ===");
console.log(requests.length === 0 ? "(none)" : requests.join("\n"));

await browser.close();
