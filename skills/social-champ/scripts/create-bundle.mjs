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
      "Usage: node create-bundle.mjs --text <caption> --fb <caption> --ig <caption> --tt <caption> --x <caption> --first-comment <text>",
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
  const selectAll = page.getByText(/Select All \(\d+\)/i);
  await selectAll.click();

  console.log("Entering global text...");
  if (args.text) {
    const editor = page.locator(".ql-editor").first();
    await editor.fill(args.text);
  }

  console.log("Toggling customization...");
  const customizeToggle = page.locator("label").filter({ hasText: "Customize for each network" });
  await customizeToggle.click();

  const networks = [
    { key: "fb", label: "Facebook", selector: "Facebook Options" },
    { key: "ig", label: "Instagram", selector: "Instagram Options" },
    { key: "tt", label: "TikTok", selector: "TikTok Options" },
    { key: "x", label: "X", selector: "X Options" },
  ];

  for (const net of networks) {
    if (args[net.key]) {
      console.log(`Customizing ${net.label}...`);
      // Click the network icon/tab to switch view
      await page.getByRole("button", { name: net.label, exact: false }).click();
      const netEditor = page.locator(".ql-editor").first();
      await netEditor.fill(args[net.key]);

      if (args["first-comment"] && net.key !== "x") {
        console.log(`Setting first comment for ${net.label}...`);
        const optionsHeader = page.getByRole("button", { name: net.selector, exact: false });
        // Expand options if needed
        if ((await optionsHeader.getAttribute("aria-expanded")) === "false") {
          await optionsHeader.click();
        }
        const commentBox = page.getByPlaceholder(/first comment/i);
        if ((await commentBox.count()) > 0) {
          await commentBox.fill(args["first-comment"]);
        }
      }
    }
  }

  console.log("Saving as Team Shared Draft...");
  await page.getByRole("button", { name: "Save Draft", exact: false }).click();
  // Depending on the dropdown/modal, might need to click "Team Sharing"
  const teamSharing = page.getByText("Team Sharing");
  if ((await teamSharing.count()) > 0) {
    await teamSharing.click();
  }

  console.log("Finalizing save...");
  await page.getByRole("button", { name: "Save Draft", exact: false }).last().click();

  await browser.close();
  console.log("Bundle saved successfully with comments and customization!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
