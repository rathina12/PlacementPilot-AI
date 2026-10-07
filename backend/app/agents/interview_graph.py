"""Stateful interview orchestration using LangGraph.

This module is intentionally isolated from the legacy interview endpoint so the
agentic flow can be tested independently before replacing production behavior.
"""

from typing import List, Optional, TypedDict
from langgraph.graph import END, START, StateGraph


class InterviewState(TypedDict, total=False):
    session_type: str
    question: str
    transcript: str
    role_requirements: List[str]
    candidate_evidence: List[str]
    missing_evidence: List[str]
    follow_up_question: Optional[str]
    needs_follow_up: bool
    final_ready: bool


def collect_evidence(state: InterviewState) -> InterviewState:
    """Normalize evidence supplied by resume/GitHub/LeetCode retrieval tools."""
    evidence = [e.strip() for e in state.get("candidate_evidence", []) if e and e.strip()]
    return {"candidate_evidence": evidence}


def identify_gaps(state: InterviewState) -> InterviewState:
    """Find role requirements that do not yet have grounded candidate evidence."""
    requirements = [r.lower() for r in state.get("role_requirements", [])]
    evidence_text = " ".join(state.get("candidate_evidence", [])).lower()

    missing = [r for r in requirements if r not in evidence_text]
    return {
        "missing_evidence": missing,
        "needs_follow_up": bool(missing),
        "final_ready": not bool(missing),
    }


def create_follow_up(state: InterviewState) -> InterviewState:
    """Generate a deterministic fallback follow-up before an LLM is introduced."""
    missing = state.get("missing_evidence", [])
    if not missing:
        return {"follow_up_question": None, "final_ready": True}

    skill = missing[0]
    return {
        "follow_up_question": (
            f"Can you give one concrete project example that demonstrates {skill}, "
            "including what you personally implemented and the result?"
        ),
        "final_ready": False,
    }


def route_after_gap_check(state: InterviewState) -> str:
    return "follow_up" if state.get("needs_follow_up") else "done"


def build_interview_graph():
    """Compile the first PlacementPilot agent graph.

    Next iterations will replace deterministic nodes with tool-calling LLM nodes
    while preserving this explicit state machine for testability.
    """
    graph = StateGraph(InterviewState)
    graph.add_node("collect_evidence", collect_evidence)
    graph.add_node("identify_gaps", identify_gaps)
    graph.add_node("create_follow_up", create_follow_up)

    graph.add_edge(START, "collect_evidence")
    graph.add_edge("collect_evidence", "identify_gaps")
    graph.add_conditional_edges(
        "identify_gaps",
        route_after_gap_check,
        {"follow_up": "create_follow_up", "done": END},
    )
    graph.add_edge("create_follow_up", END)
    return graph.compile()
