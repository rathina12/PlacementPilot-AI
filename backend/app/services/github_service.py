import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from app.core.config import settings


GITHUB_API = "https://api.github.com"


def _headers() -> dict:
    h = {"Accept": "application/vnd.github.v3+json"}
    if settings.GITHUB_TOKEN:
        h["Authorization"] = f"token {settings.GITHUB_TOKEN}"
    return h


async def fetch_github_profile(username: str) -> Optional[Dict[str, Any]]:
    """
    Fetch GitHub stats for a user using the official GitHub REST API.
    Returns structured data or None if user not found.
    """
    async with httpx.AsyncClient(timeout=15.0, headers=_headers()) as client:
        try:
            # User profile
            user_resp = await client.get(f"{GITHUB_API}/users/{username}")
            if user_resp.status_code == 404:
                return None
            user_resp.raise_for_status()
            user_data = user_resp.json()

            # Repos (up to 100)
            repos_resp = await client.get(
                f"{GITHUB_API}/users/{username}/repos",
                params={"per_page": 100, "sort": "updated"},
            )
            repos = repos_resp.json() if repos_resp.status_code == 200 else []

            # Contributions via events (last 90 days)
            events_resp = await client.get(
                f"{GITHUB_API}/users/{username}/events",
                params={"per_page": 100},
            )
            events = events_resp.json() if events_resp.status_code == 200 else []

            return _normalize_github_data(user_data, repos, events)

        except Exception as e:
            print(f"[GitHub] Error fetching {username}: {e}")
            return None


def _normalize_github_data(
    user_data: dict,
    repos: List[dict],
    events: List[dict],
) -> Dict[str, Any]:
    """Normalize GitHub API data into our internal format."""

    # Filter out forks for owned projects
    owned_repos = [r for r in repos if not r.get("fork", False)]

    # Language stats
    lang_counter: Dict[str, int] = {}
    stars = 0
    for repo in owned_repos:
        lang = repo.get("language")
        if lang:
            lang_counter[lang] = lang_counter.get(lang, 0) + 1
        stars += repo.get("stargazers_count", 0)

    languages_used = sorted(lang_counter.keys(), key=lambda x: -lang_counter[x])

    # Commit count estimate from push events
    total_commits = 0
    weekly_contributions: Dict[str, int] = {}
    for event in events:
        if event.get("type") == "PushEvent":
            payload = event.get("payload", {})
            commits = payload.get("distinct_size", 0) or len(payload.get("commits", []))
            total_commits += commits

            # Group by week
            created_at = event.get("created_at", "")
            if created_at:
                week = created_at[:10]  # YYYY-MM-DD
                weekly_contributions[week] = weekly_contributions.get(week, 0) + commits

    return {
        "repo_count": user_data.get("public_repos", 0),
        "total_commits": total_commits,
        "project_count": len(owned_repos),
        "languages_used": languages_used[:10],
        "contribution_data": weekly_contributions,
        "stars_received": stars,
        "followers": user_data.get("followers", 0),
        "last_synced": datetime.now(timezone.utc).isoformat(),
    }
