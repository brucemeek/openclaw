import type { Command } from "commander";
import { loadConfig } from "../config/config.js";
import { runGatewaySyncOnce, startGatewaySyncRunner } from "../gateway/state-sync.js";
import { defaultRuntime } from "../runtime.js";
import { formatDocsLink } from "../terminal/links.js";
import { theme } from "../terminal/theme.js";
import { runCommandWithRuntime } from "./cli-utils.js";

export function registerSyncCli(program: Command) {
  const sync = program
    .command("sync")
    .description("Gateway state sync helpers")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink(
          "/gateway/state-sync",
          "docs.openclaw.ai/gateway/state-sync",
        )}\n`,
    );

  sync
    .command("run")
    .description("Run gateway sync once (or loop when --watch is set)")
    .option("--watch", "Run sync on the configured interval", false)
    .action(async (opts: { watch?: boolean }) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const cfg = loadConfig();
        if (opts.watch) {
          const runner = startGatewaySyncRunner(cfg);
          if (!runner) {
            throw new Error("gateway.sync.enabled must be true to run sync");
          }
          await new Promise<void>((resolve) => {
            const stop = async () => {
              await runner.stop();
              resolve();
            };
            const onSigint = () => {
              void stop();
            };
            const onSigterm = () => {
              void stop();
            };
            process.once("SIGINT", onSigint);
            process.once("SIGTERM", onSigterm);
          });
          return;
        }

        const ok = await runGatewaySyncOnce(cfg);
        if (!ok) {
          throw new Error("gateway.sync.enabled must be true to run sync");
        }
      });
    });
}
