import unittest

from app.agents.interview_graph import (
    collect_evidence,
    identify_gaps,
    create_follow_up,
    build_interview_graph,
)
from app.evaluation.interview_metrics import (
    aggregate_eval,
    keyword_groundedness,
    pass_rate,
    score_spread,
)


class InterviewGraphTests(unittest.TestCase):
    def test_collect_evidence_removes_blanks(self):
        state = collect_evidence({
            "candidate_evidence": [" FastAPI API ", "", "GitHub integration"]
        })
        self.assertEqual(
            state["candidate_evidence"],
            ["FastAPI API", "GitHub integration"],
        )

    def test_gap_detection_requires_follow_up(self):
        state = identify_gaps({
            "role_requirements": ["FastAPI", "LangGraph"],
            "candidate_evidence": ["Built APIs using FastAPI"],
        })
        self.assertTrue(state["needs_follow_up"])
        self.assertIn("langgraph", state["missing_evidence"])

    def test_no_gap_finishes(self):
        state = identify_gaps({
            "role_requirements": ["FastAPI"],
            "candidate_evidence": ["Built APIs using FastAPI"],
        })
        self.assertFalse(state["needs_follow_up"])
        self.assertTrue(state["final_ready"])

    def test_follow_up_is_grounded_in_missing_skill(self):
        state = create_follow_up({"missing_evidence": ["langgraph"]})
        self.assertIn("langgraph", state["follow_up_question"].lower())

    def test_compiled_graph_runs(self):
        graph = build_interview_graph()
        result = graph.invoke({
            "role_requirements": ["FastAPI", "LangGraph"],
            "candidate_evidence": ["Built a FastAPI backend"],
        })
        self.assertTrue(result["needs_follow_up"])
        self.assertIsNotNone(result["follow_up_question"])


class EvaluationMetricTests(unittest.TestCase):
    def test_keyword_groundedness_range(self):
        score = keyword_groundedness(
            "I built a FastAPI backend",
            ["Built FastAPI APIs for placement workflows"],
        )
        self.assertGreater(score, 0.0)
        self.assertLessEqual(score, 1.0)

    def test_score_spread(self):
        self.assertEqual(score_spread([80, 85, 82]), 5)

    def test_aggregate_eval(self):
        result = aggregate_eval(0.9, 0.8, 0.85, 0.1)
        self.assertGreater(result["quality_score"], 0.8)

    def test_pass_rate(self):
        self.assertEqual(pass_rate([True, True, False, True]), 0.75)


if __name__ == "__main__":
    unittest.main()
