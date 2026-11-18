# API Requirements Note

The frontend requires the following endpoint on the backend:
- `GET /api/leaderboard` - Returns top players ranked by rating or wins.
  - Query params: `period` (all | weekly | monthly), `limit` (default: 50)
  - Response: `{ success: true, data: { leaderboard: LeaderboardEntry[], userRank?: number } }`
