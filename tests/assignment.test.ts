import assert from "node:assert/strict";
import test from "node:test";

import { buildAssignmentPlan } from "../lib/server/assignments";

test("buildAssignmentPlan keeps judges under capacity and fills minimum judge count", () => {
  const result = buildAssignmentPlan(
    [
      { id: "p1", track: "Climate", screeningScore: 5, existingJudgeIds: [] },
      { id: "p2", track: "Climate", screeningScore: 4.5, existingJudgeIds: [] },
    ],
    [
      { userId: "j1", name: "A", track: "Climate", capacity: 2, currentAssignments: 0 },
      { userId: "j2", name: "B", track: "Climate", capacity: 1, currentAssignments: 0 },
      { userId: "j3", name: "C", track: "General", capacity: 1, currentAssignments: 0 },
    ],
    {
      scope: "all",
      topN: 2,
      minimumJudges: 2,
      preferTrackJudges: true,
      keepExistingAssignments: false,
    },
  );

  assert.equal(result.assignmentMap.p1.length, 2);
  assert.equal(result.assignmentMap.p2.length, 2);
  assert.equal(result.judgeLoads.j1 <= 2, true);
  assert.equal(result.judgeLoads.j2 <= 1, true);
  assert.equal(result.judgeLoads.j3 <= 1, true);
});

test("buildAssignmentPlan preserves existing assignments when configured", () => {
  const result = buildAssignmentPlan(
    [{ id: "p1", track: "Developer Tools", screeningScore: 5, existingJudgeIds: ["j1"] }],
    [
      { userId: "j1", name: "A", track: "Developer Tools", capacity: 3, currentAssignments: 1 },
      { userId: "j2", name: "B", track: "Developer Tools", capacity: 3, currentAssignments: 0 },
    ],
    {
      scope: "all",
      topN: 1,
      minimumJudges: 2,
      preferTrackJudges: true,
      keepExistingAssignments: true,
    },
  );

  assert.deepEqual(result.assignmentMap.p1, ["j1", "j2"]);
});
