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

## Content Generation Workflow

When generating content for Social Champ, always follow the **Viral-Ready Post Protocol**:

1. **Structure:** Return exactly 4 sections (FACEBOOK, INSTAGRAM, TIKTOK, X/TWITTER).
2. **Components:**
   - **Post:** Scroll-stopping hook, punchy body, and 1 clear comment CTA.
   - **Hashtags:** Relevant niche/intent tags (FB: 2-3 in comment, IG: max 5 in comment, TT: 3-5 mix, X: 0-2 in post).
   - **First Comment:** Include `https://dreamoracle.ai` and secondary CTA (except X).
3. **Image Generation:**
   - Proactively generate a high-quality, 4K visual for the post using **Nano Banana Pro**.
   - Use the pattern: `uv run /home/ec2-user/.openclaw/workspace/skills/nanobanana-pro/scripts/generate_image.py --prompt "<detailed-brand-aligned-prompt>" --filename "<yyyy-mm-dd-hh-mm-ss-name>.png" --resolution 4K`
   - Prompt should be surreal, psychological, and high-aesthetic (Dream Oracle brand).
4. **X Communities:** Always search for the best-fit community URL (`https://x.com/i/communities/{ID}`) using web search based on the niche.
5. **Constraints:** Keep X posts under 280 chars. Use "ON-SCREEN TEXT" for TikTok (max 8 words).

## Create Post Bundle

Drafts a post for all primary platforms with "Customize for each network" enabled.

```bash
node {baseDir}/scripts/create-bundle.mjs --text "Your Global Caption" --fb "FB Custom" --ig "IG Custom" --tt "TikTok Custom" --x "X Custom"
```
