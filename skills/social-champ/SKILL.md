---
name: social-champ
description: Automate Social Champ publishing via the OpenClaw browser (CDP connection).
metadata: { "clawdbot": { "emoji": "🏆", "requires": { "bins": ["node"] } } }
---

# Social Champ Browser Skill

Automate the Social Champ dashboard using the OpenClaw-managed browser.

## Prereqs

Start the OpenClaw browser profile before running scripts:

```bash
openclaw browser start --browser-profile openclaw
```

## Configuration

Set credentials and optional CDP URL in your environment:

```bash
export SOCIAL_CHAMP_EMAIL="support@dreamoracle.ai"
export SOCIAL_CHAMP_PASSWORD="your_password"
# Optional (defaults to http://127.0.0.1:18800)
export SOCIAL_CHAMP_CDP_URL="http://127.0.0.1:18800"
```

## Create Post Bundle

Drafts a post for all primary platforms with "Customize for each network" enabled.

```bash
node {baseDir}/scripts/create-bundle.mjs --text "Your Global Caption" --fb "FB Custom" --ig "IG Custom" --tt "TikTok Custom" --x "X Custom"
```
