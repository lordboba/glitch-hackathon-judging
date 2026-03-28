import assert from "node:assert/strict";
import test from "node:test";

import { rankLeaderboardEntries } from "../lib/server/leaderboard";
import { weightedTotal } from "../lib/server/rubric";

test("weightedTotal applies rubric weights", () => {
  const total = weightedTotal({
    innovation: 5,
    execution: 4,
    impact: 4,
    design: 3,
    demo: 5,
  });

  assert.equal(total, 4.3);
});

test("rankLeaderboardEntries sorts by final score, then screening score", () => {
  const ranked = rankLeaderboardEntries([
    {
      projectId: "p1",
      projectName: "Atlas Relay",
      teamName: "Northstar",
      track: "Developer Tools",
      submittedScorecards: 2,
      averageScore: 4.5,
      screeningScore: 4.8,
      manualAdjustment: 0,
      finalScore: 4.5,
      tieBreakerNote: "",
      status: "READY",
    },
    {
      projectId: "p2",
      projectName: "Green Grid",
      teamName: "Vector Bloom",
      track: "Climate",
      submittedScorecards: 2,
      averageScore: 4.5,
      screeningScore: 4.6,
      manualAdjustment: 0,
      finalScore: 4.5,
      tieBreakerNote: "",
      status: "READY",
    },
  ]);

  assert.equal(ranked[0]?.projectId, "p1");
  assert.equal(ranked[1]?.projectId, "p2");
});
