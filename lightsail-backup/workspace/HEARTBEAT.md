# HEARTBEAT.md - Recurring Tasks

*Periodic checks I run automatically. Adjust frequency as needed.*

---

## Critical Daily Tasks

### Morning (06:00-08:00 UTC)
- [ ] Review overnight Slack mentions (#support)
- [ ] Check bruce-queue.json for P1/P2 items
- [ ] Verify Dream Oracle is reachable
- [ ] Update memory/ file if needed

### Afternoon (14:00-16:00 UTC)
- [ ] Cron job: Deliver morning report via Slack
- [ ] Check for Reddit API approval emails
- [ ] Review agent task status (Lyra, Nova, Orion)

### Evening (20:00-22:00 UTC)
- [ ] Batch Slack mentions into summary
- [ ] Check health logs for P1/P2 issues
- [ ] Prepare tomorrow's focus

---

## Memory Maintenance

### Daily
- [ ] Sync finished tasks to memory/YYYY-MM-DD.md
- [ ] Remove completed items from bruce-queue.json
- [ ] Update team-dashboard.json statuses

### Weekly (Sundays)
- [ ] Review MEMORY.md — update insights, remove outdated info
- [ ] Archive old daily files (keep 30 days, then compress)
- [ ] Update SOUL.md if personality insights emerged
- [ ] Summarize week's accomplishments for Bruce

---

## Health Checks

### Platform Checks (Every 6 hours via Koda)
- [ ] HTTP probe: dreamoracle.ai/health (<500ms target)
- [ ] Sign-up flow validation (deep health)
- [ ] Database connectivity + pool usage check
- [ ] SSL certificate expiry (>7 days remaining)

### Performance Tracking (New — Feb 10)
- [ ] Response time: p50/p95/p99 logged to koda-health-log.json
- [ ] Alert if p95 latency >2x baseline
- [ ] Error rate trending (warn >1%, critical >5%)

### Automations
- [ ] Morning report cron running
- [ ] Health check cron running
- [ ] Manual Reddit monitoring (if automated blocked)

### Dependencies
- [ ] Slack API responsive
- [ ] OpenClaw gateway stable
- [ ] External service status (if applicable)

---

## Quiet Hours

**Do NOT disturb unless P0:**
- 23:00-08:00 UTC (Bruce's sleep hours)
- Holiday exceptions (if specified in advance)

**OK to handle silently:**
- Log reviews
- Memory updates
- Internal agent coordination

**Must alert anyway (P0):**
- Security breach
- Production outage
- Unauthorized access

---

## Active Monitors

| Monitor | Frequency | Auto-Resolve? |
|---------|-----------|---------------|
| Slack mentions | Every heartbeat | No |
| Bruce queue | Every heartbeat | No |
| Platform health | Every 6 hours | Yes (Koda) |
| Reddit API status | Hourly (manual check) | No |
| Competitor pricing | Weekly (Fridays) | No |

---

## Heartbeat Response Rules

1. **Read this file** to recall active tasks
2. **Check Slack C0AD5LST0NQ** for new mentions
3. **Note findings briefly** before HEARTBEAT_OK if trivial
4. **Alert immediately** if P0 or P1 discovered
5. **Batch P2/P3** into next scheduled report

---

## Current Focus

*Update this section to track what we're working on:*

**This week:**
- Awaiting Reddit API approval
- Lyra Social Champ content drafting
- Orion Brave Search rate limit fixes deployed

**Next HB cycle:**
- Check Slack for mentions
- Verify no urgent queue items
- Log status

---

*Last updated: 2026-02-09*
*Modify as rhythms change*
