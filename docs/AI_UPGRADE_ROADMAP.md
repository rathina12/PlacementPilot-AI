# PlacementPilot AI — Agentic AI Upgrade Roadmap

## Goal

Turn the existing single-call interview assistant into a production-style,
grounded, stateful AI recruiting/evaluation system without breaking the current
student/mentor/admin product.

## Baseline discovered

The current AI service:
- calls Claude directly through a shared helper;
- parses JSON responses;
- falls back to deterministic rule-based scoring;
- has FastAPI interview endpoints and persisted interview sessions;
- already integrates candidate signals such as GitHub and LeetCode elsewhere.

This is a strong baseline, but it does not yet prove stateful orchestration, RAG,
tool calling, systematic LLM evaluation, or cloud operations.

## Upgrade phases

### Phase 1 — Explicit agent state
- Add LangGraph.
- Model candidate evidence, role requirements, follow-up state and final decision.
- Keep the legacy endpoint untouched until the new graph is tested.

### Phase 2 — Grounded retrieval
- Build candidate evidence from resume, projects, GitHub, LeetCode and interview history.
- Add retrieval with citations/evidence IDs.
- Never let the evaluator claim experience without supporting evidence.

### Phase 3 — Tool calling
Tools planned:
- get_candidate_profile
- get_candidate_projects
- get_github_signals
- get_leetcode_signals
- get_role_requirements
- get_previous_interview_answers

### Phase 4 — Evaluation harness
Track:
- relevance;
- groundedness;
- hallucination rate;
- rubric adherence;
- score stability;
- human/AI agreement;
- latency;
- token usage and cost.

### Phase 5 — Production hardening
- retries and timeouts;
- model fallback;
- structured output validation;
- rate limiting;
- tracing;
- CI tests;
- AWS deployment and CloudWatch metrics.

## Interview value

This project should tell a truthful engineering story:
1. Started with a useful but simple single-prompt implementation.
2. Identified reliability and explainability limits.
3. Introduced explicit agent state and deterministic fallbacks.
4. Added grounded retrieval and evaluation.
5. Measured quality instead of claiming improvement without evidence.
