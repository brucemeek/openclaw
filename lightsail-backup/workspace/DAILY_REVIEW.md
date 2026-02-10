# Daily Review Protocol

**Purpose:** Keep the workspace coherent, accurate, and aligned with reality.

---

## Review Principles

1. **Consistency** — Do files agree with each other?
2. **Currency** — Is information still true?
3. **Clarity** — Can anyone understand what's there?
4. **Actionability** — Are there clear next steps?

---

## Files to Review

### Daily
- `HEARTBEAT.md` — Are we checking the right things?
- `MEMORY.md` — Is our shared memory accurate?
- `AGENTS.md` — Team coordination, status, blockers
- Root `SOUL.md` — Has our voice/mission drifted?
- `memory/YYYY-MM-DD.md` — Recent context worth keeping?
- `memory/team-dashboard.json` — Any blockers or conflicts?
- `agents/*/MISSION.md` — Do agents have what they need?

### Weekly
- `IDENTITY.md` — Still who we say we are?
- `USER.md` — Bruce's context still current?
- `TOOLS.md` — Credentials, access, integrations
- `skills/*/SKILL.md` — Updates available?

---

## Review Questions

**Ask yourself:**
- What changed yesterday that should be reflected here?
- Is anything in MEMORY.md no longer true?
- Do agent instructions contradict each other?
- Are there stale TODOs or outdated action items?
- What's missing that someone might need to know?

**Red flags:**
- Pricing/feature discrepancies
- Tone/voice mismatches
- Undocumented decisions
- Old blockers still marked as active
- Agents working from outdated info

---

## Proposal Format

When I find something review-worthy, I'll propose like this:

> **REVIEW:** I noticed X doesn't match Y
> **CONTEXT:** [What changed / why it matters]
> **PROPOSAL:** [What I suggest doing]
> 
> **Approve?** (yes / no / modify)

---

## Review Log

| Date | Findings | Status |
|------|----------|--------|
| | | |

---

## Automation

- Daily cron at 7:00 AM UTC prompts the review
- Review takes 5-10 minutes
- Findings reported here for approval
- Emergency reviews on demand