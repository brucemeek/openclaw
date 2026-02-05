import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getShellConfig } from "./shell-utils.js";

const isWin = process.platform === "win32";

describe("getShellConfig", () => {
  const originalShell = process.env.SHELL;
  const originalPath = process.env.PATH;
  const tempDirs: string[] = [];

  const createTempBin = (files: string[]) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-shell-"));
    tempDirs.push(dir);
    for (const name of files) {
      const filePath = path.join(dir, name);
      fs.writeFileSync(filePath, "");
      fs.chmodSync(filePath, 0o755);
    }
    return dir;
  };

  beforeEach(() => {
    if (!isWin) {
      process.env.SHELL = "/usr/bin/fish";
    }
  });

  afterEach(() => {
    if (originalShell == null) {
      delete process.env.SHELL;
    } else {
      process.env.SHELL = originalShell;
    }
    if (originalPath == null) {
      delete process.env.PATH;
    } else {
      process.env.PATH = originalPath;
    }
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  if (isWin) {
    it("uses PowerShell on Windows", () => {
      const { shell } = getShellConfig();
      const baseName = path.basename(shell).toLowerCase();
      expect(baseName.includes("powershell") || baseName.includes("pwsh")).toBe(true);
    });

    it("falls back to cmd.exe for && when pwsh is unavailable", () => {
      const originalProgramFiles = process.env.ProgramFiles;
      const originalProgramW6432 = process.env.ProgramW6432;
      const originalProgramFilesX86 = process.env["ProgramFiles(x86)"];
      const originalPath = process.env.PATH;
      const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-shell-"));
      tempDirs.push(emptyRoot);

      process.env.ProgramFiles = emptyRoot;
      process.env.ProgramW6432 = emptyRoot;
      process.env["ProgramFiles(x86)"] = emptyRoot;
      process.env.PATH = "";

      const { shell } = getShellConfig("echo 1 && echo 2");
      expect(path.basename(shell).toLowerCase()).toBe("cmd.exe");

      if (originalProgramFiles == null) {
        delete process.env.ProgramFiles;
      } else {
        process.env.ProgramFiles = originalProgramFiles;
      }
      if (originalProgramW6432 == null) {
        delete process.env.ProgramW6432;
      } else {
        process.env.ProgramW6432 = originalProgramW6432;
      }
      if (originalProgramFilesX86 == null) {
        delete process.env["ProgramFiles(x86)"];
      } else {
        process.env["ProgramFiles(x86)"] = originalProgramFilesX86;
      }
      if (originalPath == null) {
        delete process.env.PATH;
      } else {
        process.env.PATH = originalPath;
      }
    });
    return;
  }

  it("prefers bash when fish is default and bash is on PATH", () => {
    const binDir = createTempBin(["bash"]);
    process.env.PATH = binDir;
    const { shell } = getShellConfig();
    expect(shell).toBe(path.join(binDir, "bash"));
  });

  it("falls back to sh when fish is default and bash is missing", () => {
    const binDir = createTempBin(["sh"]);
    process.env.PATH = binDir;
    const { shell } = getShellConfig();
    expect(shell).toBe(path.join(binDir, "sh"));
  });

  it("falls back to env shell when fish is default and no sh is available", () => {
    process.env.PATH = "";
    const { shell } = getShellConfig();
    expect(shell).toBe("/usr/bin/fish");
  });

  it("uses sh when SHELL is unset", () => {
    delete process.env.SHELL;
    process.env.PATH = "";
    const { shell } = getShellConfig();
    expect(shell).toBe("sh");
  });
});
