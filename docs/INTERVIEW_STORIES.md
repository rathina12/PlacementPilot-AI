# Interview Story Bank

Use only stories supported by repository history, tests or measured results.

## Story 1 — Evolving from a single LLM call to an agent workflow

**Situation:** PlacementPilot's interview evaluation originally used one Claude
request with JSON parsing and a rule-based fallback.

**Task:** Improve reliability, traceability and grounding without breaking the
working product.

**Action:** Kept the legacy path as a baseline, introduced an explicit LangGraph
state machine on a separate branch, separated evidence collection from gap
analysis, and added deterministic evaluation metrics before adding more model
calls.

**Result:** Pending measurement. Do not quote improvement percentages until the
evaluation dataset has been run.

**What I learned:** Agentic systems are not automatically better because they
have more LLM calls. Explicit state, fallbacks and evaluation make the behavior
testable.

## Story 2 — Graceful AI degradation

The existing PlacementPilot implementation already falls back to deterministic
logic when the Anthropic client or API call is unavailable. This is a useful
example for questions about production reliability, external dependency
failures, and designing user-facing AI features that still work during provider
outages.
