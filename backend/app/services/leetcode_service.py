import httpx
from typing import Optional, Dict, Any
from datetime import datetime, timezone


async def fetch_leetcode_profile(username: str) -> Optional[Dict[str, Any]]:
    """
    Fetch LeetCode stats using the GraphQL API directly.
    More reliable than third-party wrappers.
    """
    # Try primary GraphQL endpoint
    result = await _fetch_via_graphql(username)
    if result:
        return result
    # Fallback to alfa-leetcode-api
    result = await _fetch_via_alfa(username)
    return result


async def _fetch_via_graphql(username: str) -> Optional[Dict[str, Any]]:
    """Use LeetCode's public GraphQL API."""
    url = "https://leetcode.com/graphql"
    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
        userCalendar {
          streak
          totalActiveDays
        }
        profile {
          ranking
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
      }
    }
    """
    headers = {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            resp = await client.post(url, json={"query": query, "variables": {"username": username}})
            if resp.status_code != 200:
                return None
            data = resp.json().get("data", {})
            user = data.get("matchedUser")
            if not user:
                return None
            return _parse_graphql(user, data.get("userContestRanking", {}), username)
    except Exception as e:
        print(f"[LeetCode GraphQL] Error: {e}")
        return None


def _parse_graphql(user: dict, contest: dict, username: str) -> Dict[str, Any]:
    stats = user.get("submitStats", {}).get("acSubmissionNum", [])
    counts = {s["difficulty"]: s["count"] for s in stats}

    total  = counts.get("All", 0)
    easy   = counts.get("Easy", 0)
    medium = counts.get("Medium", 0)
    hard   = counts.get("Hard", 0)

    calendar = user.get("userCalendar") or {}
    streak   = calendar.get("streak", 0) or 0

    contest_data   = contest or {}
    contest_rating = round(contest_data.get("rating", 0) or 0, 2)
    global_rank    = contest_data.get("globalRanking")

    consistency = min(100.0, (streak * 2) + (total / 5))

    topic_progress = {
        "arrays": 0, "strings": 0, "linked_lists": 0, "stack": 0,
        "queue": 0, "hashing": 0, "trees": 0, "bst": 0, "heap": 0,
        "graphs": 0, "dp": 0, "greedy": 0,
        "binary_search": 0, "sorting": 0, "recursion": 0,
    }

    weak_topics = [k for k, v in topic_progress.items() if v < 5]

    return {
        "total_solved":      total,
        "easy_solved":       easy,
        "medium_solved":     medium,
        "hard_solved":       hard,
        "contest_rating":    contest_rating,
        "global_ranking":    global_rank,
        "daily_streak":      streak,
        "consistency_score": round(consistency, 1),
        "topic_progress":    topic_progress,
        "weak_topics":       weak_topics,
        "pending_problems":  max(0, 300 - total),
        "last_synced":       datetime.now(timezone.utc).isoformat(),
    }


async def _fetch_via_alfa(username: str) -> Optional[Dict[str, Any]]:
    """Fallback: alfa-leetcode-api."""
    bases = [
        "https://alfa-leetcode-api.onrender.com",
        "https://leetcode-api-faisalshohag.vercel.app",
    ]
    for base in bases:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                r = await client.get(f"{base}/{username}")
                if r.status_code == 200:
                    d = r.json()
                    total  = d.get("totalSolved", 0) or 0
                    easy   = d.get("easySolved",  0) or 0
                    medium = d.get("mediumSolved", 0) or 0
                    hard   = d.get("hardSolved",  0) or 0
                    streak = d.get("streak",       0) or 0

                    topic_progress = {
                        "arrays": 0, "strings": 0, "linked_lists": 0,
                        "stack": 0, "queue": 0, "hashing": 0,
                        "trees": 0, "bst": 0, "heap": 0,
                        "graphs": 0, "dp": 0, "greedy": 0,
                        "binary_search": 0, "sorting": 0, "recursion": 0,
                    }
                    weak_topics = [k for k, v in topic_progress.items() if v < 5]

                    return {
                        "total_solved":      total,
                        "easy_solved":       easy,
                        "medium_solved":     medium,
                        "hard_solved":       hard,
                        "contest_rating":    0,
                        "global_ranking":    None,
                        "daily_streak":      streak,
                        "consistency_score": round(min(100.0, streak * 2 + total / 5), 1),
                        "topic_progress":    topic_progress,
                        "weak_topics":       weak_topics,
                        "pending_problems":  max(0, 300 - total),
                        "last_synced":       datetime.now(timezone.utc).isoformat(),
                    }
        except Exception as e:
            print(f"[LeetCode Alfa] {base} error: {e}")
            continue
    return None
