import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

declare const __OPENCLAW_VERSION__: string | undefined;

function readVersionFromPackageJson(): string | null {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("../package.json") as { version?: string };
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

function readVersionFromBuildInfo(): string | null {
  try {
    const require = createRequire(import.meta.url);
    const candidates = ["../build-info.json", "./build-info.json"];
    for (const candidate of candidates) {
      try {
        const info = require(candidate) as { version?: string };
        if (info.version) {
          return info.version;
        }
      } catch {
        // ignore missing candidate
      }
    }
    return null;
  } catch {
    return null;
  }
}

function readVersionFromCwdPackageJson(): string | null {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(pkgPath)) {
      return null;
    }
    const raw = fs.readFileSync(pkgPath, "utf-8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? null;
  } catch {
    return null;
  }
}

// Single source of truth for the current OpenClaw version.
// - Embedded/bundled builds: injected define or env var.
// - Dev/npm builds: package.json.
export const VERSION =
  (typeof __OPENCLAW_VERSION__ === "string" && __OPENCLAW_VERSION__) ||
  process.env.OPENCLAW_BUNDLED_VERSION ||
  readVersionFromPackageJson() ||
  readVersionFromBuildInfo() ||
  readVersionFromCwdPackageJson() ||
  "0.0.0";
