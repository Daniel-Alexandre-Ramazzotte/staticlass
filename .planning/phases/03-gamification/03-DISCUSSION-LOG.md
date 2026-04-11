# Phase 3: Gamification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 03-gamification
**Areas discussed:** XP formula & streak bonuses, Ranking scope & self-highlight

---

## XP formula & streak bonuses

| Option | Description | Selected |
|--------|-------------|----------|
| Purely additive | Only correct answers give XP. No penalty for wrong answers. | ✓ |
| Penalty for wrong answers | Wrong answers subtract a small amount (e.g. -3 XP). | |
| You decide | Claude picks the default. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, flat completion bonus | +20 XP for finishing any quiz. | ✓ |
| No bonus | XP comes purely from correct answers. | |
| Streak-based bonus | Completion bonus scales with current streak. | |

| Option | Description | Selected |
|--------|-------------|----------|
| No multiplier | Streak is a separate motivational metric. | |
| Yes, small multiplier | Streak gives 1.5× XP boost at threshold. | ✓ |
| You decide | Claude picks — no multiplier. | |

| Option | Description | Selected |
|--------|-------------|----------|
| 10 XP/correct + 20 XP bonus | Clean round numbers. | ✓ |
| 10 XP/correct + 50 XP bonus | Larger completion bonus. | |
| You decide | Claude picks reasonable numbers. | |

| Option | Description | Selected |
|--------|-------------|----------|
| 7+ days → 1.5× XP | Single tier at one week. | |
| 3+ days → 1.25×, 7+ → 1.5× | Two tiers — easier early milestone. | ✓ |
| You decide | Claude picks the multiplier tier. | |

---

## Ranking scope & self-highlight

| Option | Description | Selected |
|--------|-------------|----------|
| Top-100, paginated | ROADMAP spec. Loads first 20, scroll/load more. | ✓ |
| Top-50, no pagination | One-shot list. | |
| Top-10 (existing) | Keep current behavior. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Pin own row at bottom | Always show current student's row pinned below list. | ✓ |
| Show position in header | Display 'Sua posição: #47' in screen header. | |
| Scroll to own position | Load entries up to current student's row. | |

| Option | Description | Selected |
|--------|-------------|----------|
| Global all-time only | Simplest for v1. One leaderboard. | ✓ |
| Global + weekly reset option | Toggle between all-time and this week. | |
| You decide | Claude picks — global all-time for v1. | |
