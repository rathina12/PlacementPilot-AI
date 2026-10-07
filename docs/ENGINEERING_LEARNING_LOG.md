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

## 2026-10-07 — CI dependency resolution failure

### Symptom
The first GitHub Actions run failed during `pip install -r requirements.txt`; tests never started.

### Root cause
The project pinned `pydantic==2.7.1`, while LangGraph 1.2.14 requires Pydantic >=2.7.4. FastAPI 0.111.0, pydantic-settings 2.3.1 and Anthropic 0.28.0 were otherwise compatible with the newer 2.x release.

### Failed assumption
Adding a modern agent framework to an older pinned backend dependency set would resolve without checking transitive version constraints.

### Fix
Raised the Pydantic pin from 2.7.1 to 2.7.4, the smallest compatible version satisfying LangGraph while staying inside FastAPI/Anthropic constraints.

### Interview lesson
Production AI work includes dependency management and CI, not only prompts and models. Introduce new framework dependencies behind CI and prefer the smallest compatible version change instead of broadly upgrading the stack.

### Metric
Before fix: CI stopped at dependency installation; 0 tests executed.
After fix: pending next CI run.

