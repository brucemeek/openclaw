import { chromium } from "playwright-core";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token || !token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing env var ${name}.`);
  }
  return value.trim();
}

async function ensureLoggedIn(page, email, password) {
  await page.goto("https://www.socialchamp.com/login", { waitUntil: "domcontentloaded" });

  const emailInput = page.locator('input[type="email"]');
  if ((await emailInput.count()) > 0) {
    await emailInput.fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button:has-text("Login")').click();
  }

  await page.waitForURL(/\/app\/v2\//, { timeout: 60_000 });
}

async function clickByText(page, text) {
  const button = page.getByRole("button", { name: new RegExp(text, "i") });
  if ((await button.count()) > 0) {
    await button.first().click();
    return;
  }
  await page.click(`text=${text}`);
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "Usage: node create-bundle.mjs --text <caption> --fb <caption> --ig <caption> --tt <caption> --x <caption>",
    );
    process.exit(0);
  }

  const email = requireEnv("SOCIAL_CHAMP_EMAIL");
  const password = requireEnv("SOCIAL_CHAMP_PASSWORD");
  const cdpUrl =
    process.env.SOCIAL_CHAMP_CDP_URL?.trim() ||
    process.env.OPENCLAW_BROWSER_CDP_URL?.trim() ||
    "http://127.0.0.1:18800";

  const browser = await chromium.connectOverCDP(cdpUrl);
  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = context.pages()[0] ?? (await context.newPage());

  console.log("Logging into Social Champ...");
  await ensureLoggedIn(page, email, password);

  console.log("Navigating to Publish...");
  await page.goto("https://publish.socialchamp.com/app/v2/publish/content", {
    waitUntil: "domcontentloaded",
  });

  console.log("Selecting all accounts...");
  await clickByText(page, "Select All");

  console.log("Toggling customization...");
  await clickByText(page, "Customize for each network");

  // TODO: Fill in the editor fields.
  // args.text for global, plus args.fb/args.ig/args.tt/args.x for per-network overrides.

  console.log("Saving as Team Shared Draft...");
  await clickByText(page, "Save Draft");
  await clickByText(page, "Team Sharing");

  console.log("Finalizing save...");
  await clickByText(page, "Save Draft");

  await browser.close();
  console.log("Bundle saved successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
