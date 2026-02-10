# Koda's Heartbeat - Technical Sentinel 🛡️

## Daily Monitoring Tasks

### Continuous (Automated)
- [x] Health checks running every 6h via cron
- [x] Slack alerts routing to #support
- [x] Retry logic: 3x exponential backoff

### Manual Verification (Once Daily)
- [ ] Spot-check dreamoracle.ai/health manually
- [ ] Review overnight Slack alerts (if any)
- [ ] Confirm cron jobs ran successfully

---

## Health Check Cron Jobs

**Active Automations:**
1. **HTTP Probe** (every 6h)
   - Endpoint: dreamoracle.ai/health
   - Success: `{"status":"ok"}`
   - Failure: Slack alert to #support

2. **Auth Session** (every 6h)
   - Endpoint: /api/auth/session
   - Success: 200 OK
   - Failure: Escalate to P1

3. **Homepage HTML** (every 6h)
   - Check: Contains "Dream Oracle"
   - Fallback: Manual verification

---

## Weekly Tasks (Sundays)

- [ ] Review full week's logs
- [ ] Log rotation and archival
- [ ] Security posture check
- [ ] Update MEMORY.md with any infra changes
- [ ] Run clawdstrike audit (monthly, first Sunday)

---

## Monthly Tasks (First Sunday)

- [ ] Full security audit via clawdstrike
- [ ] Review credentials permissions
- [ ] Check for outdated dependencies
- [ ] Update HEARTBEAT.md if automations changed

---

## Support Response Protocol

| Tier | Response Time | Channel | Example |
|------|---------------|---------|---------|
| P0 | Immediate | Slack DM + #support | Site outage |
| P1 | 2 hours | Slack #support | Auth failures |
| P2 | 24 hours | Slack thread | Feature bug |
| P3 | 72 hours | Queue/FAQ | General question |

---

## Alert Thresholds

- **Single failure:** Log, retry
- **2 consecutive failures:** P1 alert
- **3+ consecutive failures:** P0 alert + immediate escalation

---

## Quiet Hours
P0 outages override quiet hours. All other issues:
- 23:00-08:00 UTC: Queue until morning
- Weekend P1/P2: Queue until Monday unless critical

---

*Agent: Koda | Role: Technical Sentinel | Updated: 2026-02-09*
