const { chromium } = require("playwright");

const seeds = [87, 88, 89, 90, 91, 92, 93, 94, 95, 96];
const base = "https://sanand0.github.io/tdsdata/js_table/?seed=";

function extractNumbers(text) {
  if (!text) return [];
  const matches = text.match(/-?\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map(Number).filter(Number.isFinite);
}

async function computePageSum(page) {
  // Wait for JS to finish rendering
  await page.waitForSelector("table", { timeout: 30000 });
  await page.waitForLoadState("networkidle");

  // Only extract from table cells (not headers)
  const cellTexts = await page.$$eval("table td", cells =>
    cells.map(c => c.innerText.trim())
  );

  let sum = 0;
  for (const text of cellTexts) {
    const nums = text.match(/-?\d+(?:\.\d+)?/g);
    if (nums) {
      for (const n of nums) {
        sum += Number(n);
      }
    }
  }

  return sum;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let grandTotal = 0;

  for (const seed of seeds) {
    const url = `${base}${seed}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const pageSum = await computePageSum(page);

    grandTotal += pageSum;
    console.log(`seed=${seed} pageSum=${pageSum}`);
  }

  console.log(`Total sum=${grandTotal}`);
  console.log(`Sum=${grandTotal}`);

  await browser.close();
})();
