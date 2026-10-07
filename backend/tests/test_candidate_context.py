import unittest

from app.retrieval.candidate_context import (
    normalize_candidate_evidence,
    search_evidence,
)


class CandidateEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.evidence = normalize_candidate_evidence(
            student={
                "branch": "Computer Science",
                "cgpa": 8.1,
                "preferred_domains": ["AI", "Backend"],
            },
            coding={
                "total_solved": 150,
                "easy_solved": 60,
                "medium_solved": 75,
                "hard_solved": 15,
                "contest_rating": 1700,
            },
            github={
                "repo_count": 7,
                "languages_used": ["Python", "TypeScript"],
            },
            skills=[
                {
                    "_id": "s1",
                    "skill_name": "FastAPI",
                    "proficiency_level": "advanced",
                }
            ],
            certifications=[
                {
                    "_id": "c1",
                    "title": "AWS Certified Cloud Practitioner",
                    "issuer": "AWS",
                }
            ],
            projects=[
                {
                    "_id": "p1",
                    "title": "PlacementPilot AI",
                    "description": "AI mock interviews and resume analysis",
                    "tech_stack": ["FastAPI", "Python", "Anthropic"],
                    "github_url": "https://github.com/example/project",
                }
            ],
            interviews=[],
        )

    def test_evidence_has_provenance(self):
        self.assertTrue(self.evidence)
        self.assertTrue(all("evidence_id" in item for item in self.evidence))
        self.assertTrue(all("source" in item for item in self.evidence))

    def test_project_evidence_preserves_tech_stack(self):
        project = next(item for item in self.evidence if item["source"] == "project")
        self.assertIn("FastAPI", project["text"])
        self.assertIn("Python", project["text"])

    def test_search_returns_grounded_project(self):
        results = search_evidence("FastAPI project", self.evidence, limit=3)
        self.assertTrue(results)
        self.assertEqual(results[0]["source"], "project")

    def test_search_is_empty_for_unrelated_claim(self):
        results = search_evidence("Kubernetes Terraform", self.evidence)
        self.assertEqual(results, [])


if __name__ == "__main__":
    unittest.main()
