const { chromium } = require("playwright");

const seeds = [87, 88, 89, 90, 91, 92, 93, 94, 95, 96];
const base = "https://sanand0.github.io/tdsdata/js_table/?seed=";

// Extract numbers like 1,234 or -56.78 or 1234.56
function extractNumbers(text) {
  if (!text) return [];
  const matches = text.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map(m => Number(m.replace(/,/g, ""))).filter(Number.isFinite);
}

// Compute sum of ALL numbers in ALL tables on the page (cells + headers)
async function computeTableSum(page) {
  const cellTexts = await page.$$eval("table", (tables) =>
    tables.flatMap((t) =>
      Array.from(t.querySelectorAll("th, td")).map((el) => el.innerText || "")
    )
  );

  let sum = 0;
  for (const txt of cellTexts) {
    for (const n of extractNumbers(txt)) sum += n;
  }
  return sum;
}

// Wait until the table sum is stable for a few consecutive checks
async function waitForStableSum(page, { intervalMs = 500, stableChecks = 3, timeoutMs = 30000 } = {}) {
  const start = Date.now();
  let last = null;
  let stableCount = 0;

  while (Date.now() - start < timeoutMs) {
    const current = await computeTableSum(page);

    if (last !== null && current === last) {
      stableCount += 1;
    } else {
      stableCount = 0;
    }

    last = current;

    if (stableCount >= stableChecks) {
      return current;
    }

    await page.waitForTimeout(intervalMs);
  }

  // If not stable by timeout, return the latest value (better than failing)
  return last ?? 0;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let grandTotal = 0;

  for (const seed of seeds) {
    const url = `${base}${seed}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for at least one table to appear
    await page.waitForSelector("table", { timeout: 30000 });

    // Wait until sums stop changing (tables fully rendered)
    const pageSum = await waitForStableSum(page, {
      intervalMs: 500,
      stableChecks: 3,
      timeoutMs: 30000,
    });

    grandTotal += pageSum;
    console.log(`seed=${seed} pageSum=${pageSum}`);
  }

  console.log(`Total sum=${grandTotal}`);
  console.log(`Sum=${grandTotal}`);

  await browser.close();
})().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
