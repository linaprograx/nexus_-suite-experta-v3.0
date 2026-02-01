---
name: Production Readiness Audit
description: Deep analysis skill for evaluating Nexus Suite's production readiness, identifying critical gaps in authentication, performance, native app requirements, and launch preparation.
version: 1.0.0
author: Nexus Development Team
created: 2026-01-31
---

# Production Readiness Audit Skill

## Purpose
This skill provides a comprehensive, NotebookLM-style investigation into the Nexus Suite application's readiness for production deployment and native app conversion. It analyzes the codebase across 10 critical dimensions and provides actionable recommendations.

## How to Use This Skill

### 1. Review the Audit
Read [`PRODUCTION_AUDIT.md`](./PRODUCTION_AUDIT.md) for the complete analysis.

### 2. Prioritize Actions
Focus on the **Critical (🔴)** items first:
- Authentication & Security
- Error Handling
- Offline Support
- Performance Optimization
- Native App Setup

### 3. Follow the Roadmap
Use the 10-week action plan provided in the audit to systematically address each gap.

### 4. Track Progress
Use the checklists in each section to monitor completion.

## Key Findings Summary

### 🔴 Critical Blockers
1. **No production-grade authentication** (OAuth, MFA missing)
2. **No error boundaries** (app crashes to white screen)
3. **No offline support** (breaks without internet)
4. **No performance optimization** (large bundle, no code splitting)
5. **No native app configuration** (Capacitor not set up)

### 🟡 High Priority
6. **No testing framework** (zero tests)
7. **No CI/CD pipeline** (manual deployments)
8. **No monitoring** (can't track production errors)
9. **Accessibility gaps** (WCAG non-compliant)
10. **Missing core features** (user settings, search, analytics)

### 🟢 Medium Priority
11. **Collaboration features** (team workspaces, sharing)
12. **Advanced integrations** (calendar, accounting software)
13. **Analytics dashboard** (usage insights)

## Estimated Timeline

- **Production Web App**: 8-10 weeks
- **Native iOS/Android Apps**: 10-12 weeks
- **Full Feature Parity**: 14-16 weeks

## Next Immediate Actions

1. **Week 1**: Set up error boundaries + Sentry
2. **Week 2**: Implement Google OAuth + offline persistence
3. **Week 3**: Code splitting + performance optimization
4. **Week 4**: Install Capacitor + configure native projects

## Files in This Skill

- `SKILL.md` - This file (skill metadata and usage guide)
- `PRODUCTION_AUDIT.md` - Complete production readiness analysis
- `IMPLEMENTATION_GUIDE.md` - Step-by-step implementation instructions (to be created)
- `NATIVE_CONVERSION_GUIDE.md` - Native app conversion guide (to be created)

## Maintenance

This audit should be re-run:
- Before each major release
- After significant architecture changes
- Quarterly for continuous improvement

## Related Skills

- **Nexus App Auditor · Evolutive Skill** - Ongoing quality monitoring
- **Migrator Style Mobile-Desktop** - UI consistency auditing

---

**Last Updated**: 2026-01-31  
**Audit Confidence**: High (based on comprehensive codebase analysis)
