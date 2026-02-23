const { chromium } = require("playwright");

const seeds = [87, 88, 89, 90, 91, 92, 93, 94, 95, 96];
const base = "https://sanand0.github.io/tdsdata/js_table/?seed=";

function extractNumbers(text) {
  if (!text) return [];
  const matches = text.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map(m => Number(m.replace(/,/g, ""))).filter(Number.isFinite);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let grandTotal = 0;

  for (const seed of seeds) {
    const url = `${base}${seed}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("table", { timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

    const tableTexts = await page.$$eval("table", tables =>
      tables.map(t => t.innerText || "")
    );

    let pageSum = 0;
    for (const t of tableTexts) {
      for (const n of extractNumbers(t)) pageSum += n;
    }

    grandTotal += pageSum;
    console.log(`seed=${seed} pageSum=${pageSum}`);
  }

  console.log(`Total sum=${grandTotal}`);
  console.log(`Sum=${grandTotal}`);
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
