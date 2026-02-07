import type { OpenClawConfig } from "../config/config.js";
import type { GatewaySyncDirection } from "../config/types.gateway.js";
import { loadConfig } from "../config/config.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { runCommandWithTimeout } from "../process/exec.js";
import { CONFIG_DIR, resolveUserPath } from "../utils.js";

export type GatewaySyncRunner = {
  stop: () => Promise<void>;
};

type SyncMapping = {
  local: string;
  remote: string;
};

type SyncResolvedConfig = {
  enabled: boolean;
  direction: GatewaySyncDirection;
  intervalMs: number;
  initialDelayMs: number;
  timeoutMs: number;
  rsyncPath: string;
  deleteEnabled: boolean;
  dryRun: boolean;
  backupDir?: string;
  exclude: string[];
  remote: {
    sshTarget?: string;
    path?: string;
    sshIdentity?: string;
    sshPort: number;
    sshOptions: string[];
  };
  local: {
    path: string;
  };
  mappings: SyncMapping[];
};

const DEFAULT_EXCLUDES = [
  "**/.git",
  "**/node_modules",
  "**/dist",
  "cron/runs/*.jsonl",
  "agents/*/sessions/*.jsonl",
];

const log = createSubsystemLogger("gateway/sync");

function resolveSyncConfig(cfg: OpenClawConfig): SyncResolvedConfig | null {
  const sync = cfg.gateway?.sync;
  if (!sync || sync.enabled !== true) {
    return null;
  }

  const intervalMinutes = sync.intervalMinutes ?? 5;
  const intervalMs = Math.max(60_000, Math.floor(intervalMinutes * 60_000));
  const initialDelayMs = Math.max(0, Math.floor(sync.initialDelayMs ?? 30_000));
  const timeoutMs = Math.max(30_000, Math.floor(sync.timeoutMs ?? 300_000));
  const direction = sync.direction ?? "both";
  const rsyncPath = sync.rsyncPath?.trim() || "rsync";
  const deleteEnabled = sync.delete ?? true;
  const dryRun = sync.dryRun === true;
  const backupDir = sync.backupDir?.trim() || undefined;
  const exclude = sync.exclude ? sync.exclude : DEFAULT_EXCLUDES;

  const localPath = resolveUserPath(sync.local?.path?.trim() || CONFIG_DIR);
  const remotePath = sync.remote?.path?.trim() || undefined;
  const mappings: SyncMapping[] = [];
  if (remotePath) {
    mappings.push({ local: localPath, remote: remotePath });
  }
  for (const extra of sync.mappings ?? []) {
    if (!extra || !extra.local || !extra.remote) {
      continue;
    }
    mappings.push({ local: extra.local, remote: extra.remote });
  }

  return {
    enabled: true,
    direction,
    intervalMs,
    initialDelayMs,
    timeoutMs,
    rsyncPath,
    deleteEnabled,
    dryRun,
    backupDir,
    exclude,
    remote: {
      sshTarget: sync.remote?.sshTarget?.trim() || undefined,
      path: remotePath,
      sshIdentity: sync.remote?.sshIdentity?.trim() || undefined,
      sshPort:
        sync.remote?.sshPort && Number.isFinite(sync.remote.sshPort) ? sync.remote.sshPort : 22,
      sshOptions: sync.remote?.sshOptions ? sync.remote.sshOptions : [],
    },
    local: { path: localPath },
    mappings,
  };
}

function normalizeLocalPath(input: string): string {
  const resolved = resolveUserPath(input);
  if (process.platform === "win32") {
    return resolved.replace(/\\/g, "/");
  }
  return resolved;
}

function ensureTrailingSlash(input: string): string {
  if (input.endsWith("/") || input.endsWith("\\")) {
    return input;
  }
  return `${input}/`;
}

function buildSshCommand(cfg: SyncResolvedConfig): string | null {
  const target = cfg.remote.sshTarget;
  if (!target) {
    return null;
  }
  const parts = ["ssh", "-p", String(cfg.remote.sshPort)];
  if (cfg.remote.sshIdentity) {
    parts.push("-i", cfg.remote.sshIdentity);
  }
  for (const opt of cfg.remote.sshOptions) {
    const trimmed = opt.trim();
    if (!trimmed) {
      continue;
    }
    parts.push("-o", trimmed);
  }
  return parts.join(" ");
}

function buildRsyncArgs(params: {
  cfg: SyncResolvedConfig;
  source: string;
  dest: string;
  sshCommand?: string | null;
}): string[] {
  const args = ["-a"];
  if (params.cfg.deleteEnabled) {
    args.push("--delete");
  }
  if (params.cfg.dryRun) {
    args.push("--dry-run");
  }
  if (params.cfg.backupDir) {
    args.push("--backup", `--backup-dir=${params.cfg.backupDir}`);
  }
  for (const pattern of params.cfg.exclude) {
    if (pattern.trim()) {
      args.push(`--exclude=${pattern}`);
    }
  }
  if (params.sshCommand) {
    args.push("-e", params.sshCommand);
  }
  args.push(params.source, params.dest);
  return args;
}

async function runRsync(params: {
  cfg: SyncResolvedConfig;
  direction: "push" | "pull";
  mapping: SyncMapping;
}): Promise<void> {
  const sshCommand = buildSshCommand(params.cfg);
  if (!sshCommand || !params.cfg.remote.sshTarget) {
    log.warn("gateway sync: missing remote.sshTarget; skipping sync");
    return;
  }
  const localPath = normalizeLocalPath(params.mapping.local);
  const remotePath = ensureTrailingSlash(params.mapping.remote.replace(/\\/g, "/"));
  const remoteTarget = `${params.cfg.remote.sshTarget}:${remotePath}`;
  const source = params.direction === "push" ? ensureTrailingSlash(localPath) : remoteTarget;
  const dest = params.direction === "push" ? remoteTarget : ensureTrailingSlash(localPath);
  const argv = [
    params.cfg.rsyncPath,
    ...buildRsyncArgs({
      cfg: params.cfg,
      source,
      dest,
      sshCommand,
    }),
  ];
  const result = await runCommandWithTimeout(argv, { timeoutMs: params.cfg.timeoutMs });
  if (result.code !== 0) {
    const details = result.stderr.trim() || result.stdout.trim();
    const suffix = details ? `: ${details}` : "";
    throw new Error(`rsync ${params.direction} failed (exit ${result.code})${suffix}`);
  }
}

async function runSyncCycle(cfg: SyncResolvedConfig): Promise<void> {
  if (!cfg.remote.sshTarget) {
    log.warn("gateway sync: remote.sshTarget is required");
    return;
  }
  if (!cfg.remote.path && cfg.mappings.length === 0) {
    log.warn("gateway sync: remote.path or mappings are required");
    return;
  }
  if (cfg.direction === "both" && !cfg.backupDir) {
    log.warn("gateway sync: direction=both without backupDir may cause data loss on conflicts");
  }
  const mappings = cfg.mappings.map((mapping) => ({
    local: resolveUserPath(mapping.local),
    remote: mapping.remote,
  }));
  for (const mapping of mappings) {
    if (cfg.direction === "push" || cfg.direction === "both") {
      await runRsync({ cfg, direction: "push", mapping });
    }
    if (cfg.direction === "pull" || cfg.direction === "both") {
      await runRsync({ cfg, direction: "pull", mapping });
    }
  }
}

export async function runGatewaySyncOnce(cfg: OpenClawConfig): Promise<boolean> {
  const resolved = resolveSyncConfig(cfg);
  if (!resolved) {
    log.warn("gateway sync: disabled or missing configuration");
    return false;
  }
  await runSyncCycle(resolved);
  return true;
}

export function startGatewaySyncRunner(cfgAtStart: OpenClawConfig): GatewaySyncRunner | null {
  const initial = resolveSyncConfig(cfgAtStart);
  if (!initial) {
    return null;
  }

  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<void> | null = null;
  let pending = false;

  const schedule = (delayMs: number) => {
    if (stopped) {
      return;
    }
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(runOnce, delayMs);
  };

  const runOnce = async () => {
    if (stopped) {
      return;
    }
    if (inFlight) {
      pending = true;
      return;
    }
    const latestConfig = loadConfig();
    const latest = resolveSyncConfig(latestConfig);
    if (!latest) {
      schedule(initial.intervalMs);
      return;
    }
    inFlight = (async () => {
      try {
        log.info("gateway sync: starting");
        await runSyncCycle(latest);
        log.info("gateway sync: complete");
      } catch (err) {
        log.warn(`gateway sync: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();

    try {
      await inFlight;
    } finally {
      inFlight = null;
    }
    if (pending) {
      pending = false;
      schedule(0);
      return;
    }
    schedule(latest.intervalMs);
  };

  schedule(initial.initialDelayMs);

  return {
    stop: async () => {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      await inFlight?.catch(() => undefined);
    },
  };
}
