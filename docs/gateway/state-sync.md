---
summary: "Two way state sync between a VPS gateway and a local machine"
read_when:
  - You want to keep state and workspace synced between a VPS and local
  - You are enabling the built in rsync sync runner
title: "State Sync"
---

# State sync

This guide describes two way sync for OpenClaw state between a VPS gateway host and a local machine using the built in rsync runner.

## What to sync

OpenClaw stores mutable data under the state directory. Default is `~/.openclaw` and it can be overridden with `OPENCLAW_STATE_DIR`.

Common state contents:

- `openclaw.json` config
- `cron/` cron jobs and run history
- `skills/` managed skills
- `tools/` downloaded skill tools
- `workspace/` agent workspace files
- `credentials/` provider state and auth material
- `agents/` sessions and agent caches
- `extensions/` managed plugins
- `hooks/` managed hooks

If you set `OPENCLAW_STATE_DIR=/var/lib/openclaw`, the config path becomes `/var/lib/openclaw/openclaw.json` by default.

## Prerequisites

- `rsync` installed on both hosts.
- SSH access between hosts.
- The same state dir path on both hosts, or explicit mappings.

## Configuration

Add `gateway.sync` to your config.

```json5
{
  gateway: {
    sync: {
      enabled: true,
      direction: "both",
      intervalMinutes: 5,
      backupDir: ".sync-backups",
      exclude: ["cron/runs/*.jsonl", "agents/*/sessions/*.jsonl"],
      local: { path: "/var/lib/openclaw" },
      remote: {
        sshTarget: "ec2-user@gateway-host",
        path: "/var/lib/openclaw",
        sshIdentity: "~/.ssh/id_ed25519",
        sshPort: 22,
      },
    },
  },
}
```

If your workspace lives outside the state dir, add a mapping:

```json5
{
  gateway: {
    sync: {
      enabled: true,
      remote: { sshTarget: "ec2-user@gateway-host", path: "/var/lib/openclaw" },
      mappings: [{ local: "/data/openclaw-workspace", remote: "/data/openclaw-workspace" }],
    },
  },
}
```

## Running the sync runner

The runner can be started either by the gateway or by the CLI.

If you run gateways on both hosts, avoid editing the same files at the same time. Use `backupDir` to keep conflict copies.

- Gateway: runs automatically when `gateway.sync.enabled` is true.
- CLI: run on hosts that should sync but do not run the gateway.

```bash
openclaw sync run --watch
```

For a one shot sync:

```bash
openclaw sync run
```

## Optional ignore list

If you want less churn, add excludes in `gateway.sync.exclude`. Keep a full mirror if you want full backups.

```
**/.git
**/node_modules
**/dist
cron/runs/*.jsonl
agents/*/sessions/*.jsonl
```

If you do not want credentials on Windows, also exclude:

```
credentials/**
```

## Backups

Sync is not a backup. Keep regular backups of the state dir and workspace so you can recover from corruption or accidental deletes.

Recommendations:

- Stop the gateway before a backup when possible, or use filesystem snapshots on the VPS.
- Keep multiple backup versions (daily + weekly) and store them off the VPS.
- Encrypt backups and restrict access because the state dir contains secrets.

Example (rsync to a backup host):

```bash
rsync -a --delete /var/lib/openclaw/ user@backup-host:/backups/openclaw/state/
```

Example (local archive on the VPS):

```bash
tar -czf /backups/openclaw-state-$(date +%Y%m%d).tgz -C /var/lib openclaw
```

## Gateway service environment

Make sure the gateway service uses the same state dir.

Systemd user service drop in:

```
mkdir -p ~/.config/systemd/user/openclaw-gateway.service.d
cat <<'EOF' > ~/.config/systemd/user/openclaw-gateway.service.d/override.conf
[Service]
Environment=OPENCLAW_STATE_DIR=/var/lib/openclaw
EOF
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Systemd system service drop in:

```
sudo mkdir -p /etc/systemd/system/openclaw-gateway.service.d
sudo tee /etc/systemd/system/openclaw-gateway.service.d/override.conf <<'EOF'
[Service]
Environment=OPENCLAW_STATE_DIR=/var/lib/openclaw
EOF
sudo systemctl daemon-reload
sudo systemctl restart openclaw-gateway.service
```

## Migrating an existing state dir

1. Stop the gateway on the VPS.
2. Move the current state dir into `/var/lib/openclaw`.
3. Set `OPENCLAW_STATE_DIR` for the gateway service.
4. Start the gateway and confirm it reads the new state dir.

## Verification

- `openclaw status` shows the expected state dir.
- Cron jobs appear in `openclaw cron list`.
- Skills are visible in the Control UI.
- `openclaw sync run` completes without errors.

## Security notes

The state dir contains secrets. Treat sync targets and backups as production secrets.

## Related

- [Migration Guide](/install/migrating)
- [Remote Access](/gateway/remote)
- [Gateway Security](/gateway/security)
