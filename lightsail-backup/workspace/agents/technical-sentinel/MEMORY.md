# Koda - Long-Term Memory
*Technical Sentinel's curated knowledge*

---

## 🚨 NEVER FORGET

**Security is non-negotiable:**
- Run security audits monthly via clawdstrike
- Check credentials directory permissions (should be 700)
- Never print secrets in logs
- Report P0 issues immediately (not batched)

**Support Response Times:**
- P0 (outage): Immediate
- P1 (major bug): 2-hour response
- P2 (feature issue): 24-hour response
- P3 (question): 72-hour response

**Pricing for Support FAQ:**
- Free tier: 3 deep analyses/mo, 5 questions/session
- Paid tier: $7.99/mo, 10 analyses/mo, 9 questions/session

---

## Health Check Endpoints

| Priority | Endpoint | Expected | Failure Action |
|----------|----------|----------|----------------|
| P0 | https://dreamoracle.ai/health | `{"status":"ok"}` | Alert Bruce immediately |
| P0 | /api/auth/session | 200 OK | Escalate to P1 |
| P1 | Homepage HTML | Contains "Dream Oracle" | Create ticket |
| P2 | Supabase dashboard | Accessible | Log, monitor |

---

## Support FAQ (Quick Reference)

**Q: Analysis limit hit?**
A: "Free: 3/mo, Paid: 10/mo. Check Settings → Subscription."

**Q: Data secure?**
A: "End-to-end encrypted via Supabase. We can't read your dreams."

**Q: How to export?**
A: "Settings → Data → Export. JSON file."

**Q: App crashes?**
A: "Clear cache or reinstall. Escalate if persists."

**Q: Login issues?**
A: "Check spam folder first. Then DM me your email."

**Q: Price?**
A: "$7.99/mo Reflective Explorer. Free tier available."

---

## Cron Automations

| Job | Frequency | Status |
|-----|-----------|--------|
| Health check (HTTP) | Every 6h | ✅ Active |
| Health check (auth) | Every 6h | ✅ Active |
| Security audit | Monthly | clawdstrike |
| Log rotation | Weekly | Manual |

---

## Incident Response

**P0 Outage:**
1. Confirm via multiple endpoints
2. Alert Bruce immediately (DM in Slack)
3. Check dreamoracle.ai/health
4. Document in memory/YYYY-MM-DD.md
5. Post-mortem within 24h

**Security Incident:**
1. Isolate if possible
2. Alert Bruce + Mia immediately
3. Run clawdstrike audit
4. Document all findings
5. Remediate with approval

---

## Infrastructure

**Platform:** dreamoracle.ai
- Host: Amazon Linux 2023 (AWS EC2)
- Node: v22.22.0
- Gateway: OpenClaw 2026.2.6-3
- Database: Supabase Postgres (RLS enabled)

**Team Channels:**
- Slack: #support (alerts)
- Direct: @bruce.meek (P0)

---

*Last updated: 2026-02-09*
