# Arena balance baseline

The browser runtime remains authoritative in typed GDScript. `tools/analyze_balance.py` is a standard-library Python mirror for fast offline experiments; fixed RNG and result fixtures in both test suites expose rule drift.

## Prototype baseline

The current baseline runs 100 samples for every ordered pairing of four Houses and every pairing of four legal strategies: 19,200 deterministic bouts in total.

| Dimension | Lowest win rate | Highest win rate | Spread | Warning threshold |
| --- | ---: | ---: | ---: | ---: |
| House | 41.44% | 58.93% | 17.49% | 20% |
| Strategy | 49.22% | 50.70% | 1.48% | 15% |

No threshold warning is active in this baseline. These numbers are a regression signal, not proof that the game is fun: human lineup choices, weekly condition, clarity, and perceived fairness still require playtesting.

The first automated pass exposed two real issues. Strategy modifiers granted raw power instead of tradeoffs, and AI lineups depended on roster order. Resolver `arena-0.4.0` uses near-neutral attack/defense exchanges, a broader but still seeded exchange range, and condition-aware legal lineup recommendations. The player receives the same recommendation as a removable default.

## Reproduce

```powershell
python tools/analyze_balance.py --samples 100 --output build/balance-report.json
```

Use `--strict` when a workflow should fail if a threshold is exceeded. Reports belong in ignored `build/` output; update this documented baseline only when an intentional resolver or content change has been reviewed.

## Review rules

- Change `resolver_version` whenever a released result contract changes.
- Update the shared parity fixture in Godot and Python only after confirming both implementations independently.
- Investigate a warning before widening its threshold.
- Prefer readable tradeoffs and legal AI decisions over compensating bonuses.
- Keep seeded variance high enough for suspense but low enough that lineup condition and management choices remain explainable.
