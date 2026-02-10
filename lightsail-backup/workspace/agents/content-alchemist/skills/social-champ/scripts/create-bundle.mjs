import { chromium } from "playwright-core";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token || !token.startsWith("--")) continue;
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
  if (!value || !value.trim()) throw new Error(`Missing env var ${name}.`);
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

async function openAccountDropdown(page) {
  console.log("Opening account dropdown...");
// Primary: click the user-card element (DreamOracle AI account selector)
  const userCard = page.locator(".user-card").first();
  try {
    if ((await userCard.count()) > 0) {
      await userCard.click();
      console.log("Clicked .user-card");
      await page.waitForTimeout(500);
      return true;
    }
  } catch (e) {
    console.log("user-card click failed:", e.message);
  }

// Fallback: try button selectors

  const candidates = [
    page.getByRole("button").filter({ hasText: /Facebook.*DreamOracle|DreamOracle.*Facebook/i }).first(),
    page.getByRole("button").filter({ hasText: /DreamOracle|Facebook/i }).first(),
    page.getByRole("button").filter({ hasText: /Social/i }).first(),
    page.locator("[role=button], button").filter({ hasText: /DreamOracle|Facebook/i }).first(),
  ];

  for (const btn of candidates) {
    try {
      if ((await btn.count()) > 0) {
        await btn.click();
        return true;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return false;
}

async function isSelectedOption(option) {
  return await option.evaluate((el) => {
    const ariaChecked = el.getAttribute("aria-checked");
    const ariaSelected = el.getAttribute("aria-selected");
    const dataState = el.getAttribute("data-state");
    const className = el.getAttribute("class") || "";
    return (
      ariaChecked === "true" ||
      ariaSelected === "true" ||
      dataState === "checked" ||
      /selected|active|checked/i.test(className)
    );
  });
}

async function selectAllAccounts(page) {
  console.log("Selecting accounts...");
  const opened = await openAccountDropdown(page);
  if (!opened) {
    console.log("Account dropdown not found.");
    return;
  }

  await page.waitForTimeout(500);
  const selectAll = page.getByText(/Select All/i).first();
  if ((await selectAll.count()) > 0) {
    await selectAll.click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    return;
  }

  const options = page
    .locator('[role="menuitemcheckbox"], [role="option"], [role="menuitem"]')
    .filter({ hasNotText: /Select All/i });
  const count = await options.count();
  for (let i = 0; i < count; i += 1) {
    const option = options.nth(i);
    const text = (await option.textContent())?.trim() || "";
    if (!text) continue;
    if (!(await isSelectedOption(option))) {
      await option.click().catch(() => {});
      await page.waitForTimeout(150);
    }
  }

  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "Usage: node create-bundle.mjs --text <global> --fb <text> --ig <text> --tt <text> --x <text> --first-comment <text>",
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
  await page.waitForTimeout(1000);

  try {
    await selectAllAccounts(page);
  } catch (e) {
    console.log("Account selection skipped (may already be selected)");
  }

  // Find all text editors and fill them
  console.log("Filling content...");
  const editors = await page.locator(".ql-editor").all();
  console.log(`Found ${editors.length} editors`);

  // Editor index map: usually [0]=global, [1]=fb, [2]=ig, [3]=tt, [4]=x
  const contentMap = [
    { idx: 0, key: "text", label: "global" },
    { idx: 1, key: "fb", label: "Facebook" },
    { idx: 2, key: "ig", label: "Instagram" },
    { idx: 3, key: "x", label: "X" },
  ];

  for (const { idx, key, label } of contentMap) {
    if (args[key] && editors[idx]) {
      try {
        await editors[idx].scrollIntoViewIfNeeded();
        await editors[idx].fill(args[key]);
        console.log(`Filled ${label}`);
      } catch (e) {
        console.log(`Failed to fill ${label}: ${e.message}`);
      }
    }
  }

  // Add first comment if specified
  if (args["first-comment"]) {
    console.log("Adding first comment...");
    const commentInputs = await page.locator("textarea, input[placeholder]").all();
    for (const input of commentInputs) {
      const placeholder = await input.getAttribute("placeholder");
      const isReadOnly = await input.evaluate((el) => el.readOnly || el.disabled);
      // Skip read-only inputs (like date pickers) and look for actual text inputs
      if (placeholder?.toLowerCase().includes("first comment") && !isReadOnly) {
        await input.fill(args["first-comment"]);
        console.log("First comment added");
        break;
      }
    }
  }

  // Save as draft
  console.log("Saving draft...");
  try {
    await page.getByRole("button").filter({ hasText: /Save Draft/i }).first().click();
    await page.waitForTimeout(500);

    // Check for team sharing option
    const teamSharing = page.getByText(/Team Sharing|Share with team/i).first();
    if ((await teamSharing.count()) > 0) await teamSharing.click();

    // Final save
    const confirmBtn = page
      .getByRole("button")
      .filter({ hasText: /Save Draft|Save$/i })
      .first();
    if ((await confirmBtn.count()) > 0) await confirmBtn.click();

    console.log("Draft saved successfully!");
  } catch (e) {
    console.log("Draft save error:", e.message);
  }

  await browser.close();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
