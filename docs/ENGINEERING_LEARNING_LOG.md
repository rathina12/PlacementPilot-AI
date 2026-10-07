# Engineering Learning & Failure Log

This file records real implementation decisions, failures, rejected approaches
and measurable outcomes. It exists so project retrospectives and interviews are
based on evidence rather than reconstructed stories.

## 2026-10-07 — Baseline review

### Observation
The existing interview evaluator is a direct Claude call with JSON parsing and a
rule-based fallback.

### What is good
- graceful degradation when no model/API key is available;
- simple operational path;
- deterministic fallback keeps the product usable.

### Limitation
A single model call has no explicit state machine, no evidence retrieval, no
tool-use trace and no systematic evaluation harness.

### Decision
Do not rewrite the current endpoint immediately. Build the agentic flow in an
isolated package first, test it, compare it with the baseline, and only then
route production traffic to it.

### Why this matters
This gives us a clean A/B baseline and reduces regression risk.

## Failure log template

For every meaningful failure, add:
- date;
- symptom;
- root cause;
- attempted fix;
- why that fix worked or failed;
- metric before/after;
- interview lesson.

Do not invent metrics. Only record measured results.
