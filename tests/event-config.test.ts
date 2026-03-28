import assert from "node:assert/strict";
import test from "node:test";

import { listMatchingPlaceholderEventFields, parseTrackList } from "../lib/server/event-config";

test("parseTrackList trims values and drops empty entries", () => {
  assert.deepEqual(parseTrackList("Developer Tools, Climate, , Healthcare "), [
    "Developer Tools",
    "Climate",
    "Healthcare",
  ]);
});

test("listMatchingPlaceholderEventFields detects known synthetic event markers", () => {
  const matches = listMatchingPlaceholderEventFields({
    name: "AI Builder Finals",
    hostOrganization: "Signal Labs",
    slug: "ai-builder-finals-2026",
    timezone: "America/Los_Angeles",
    startDate: new Date("2026-05-14T09:00:00.000Z"),
    endDate: new Date("2026-05-17T23:00:00.000Z"),
    location: "San Francisco, CA",
    tracks: ["Developer Tools", "Climate", "Healthcare", "Education"],
    organizerGoal:
      "Host a flexible hackathon shell that supports private cohorts, invited judges, and clean scoring operations.",
  });

  assert.deepEqual(matches, [
    "name",
    "hostOrganization",
    "slug",
    "timezone",
    "startDate",
    "endDate",
    "location",
    "tracks",
    "organizerGoal",
  ]);
});
