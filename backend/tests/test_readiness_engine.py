"""Deterministic scoring regression tests (no database or API keys required)."""
import unittest
from app.ml.readiness_engine import compute_placement_readiness, get_peer_benchmark


class ReadinessEngineTests(unittest.TestCase):
    def test_empty_profile(self):
        result = compute_placement_readiness()
        self.assertEqual(result["overall_score"], 0)
        self.assertEqual(result["risk_level"], "high")
        self.assertTrue(result["needs_attention"])

    def test_scores_are_bounded(self):
        result = compute_placement_readiness(
            coding={"total_solved": 2000, "medium_solved": 1500, "hard_solved": 500,
                    "daily_streak": 500, "contest_rating": 3500, "consistency_score": 100},
            github={"repo_count": 1000, "total_commits": 10000, "project_count": 100,
                    "languages_used": list("abcdefghij")},
            cert_count=200, project_count=200, has_featured_project=True,
            interview_sessions=[{"overall_score": 100, "communication_score": 100}],
            skill_count=3, skill_levels=["advanced"] * 3,
        )
        self.assertLessEqual(result["overall_score"], 100)
        self.assertLessEqual(result["placement_probability"], 99)

    def test_peer_rank_above_everyone(self):
        result = get_peer_benchmark(95, [40, 50, 80])
        self.assertEqual(result["rank_in_batch"], 1)

    def test_peer_rank_below_everyone(self):
        result = get_peer_benchmark(20, [40, 50, 80])
        self.assertEqual(result["rank_in_batch"], 4)

    def test_tied_scores_share_rank(self):
        result = get_peer_benchmark(50, [80, 50, 50, 20])
        self.assertEqual(result["rank_in_batch"], 2)


if __name__ == "__main__":
    unittest.main()
