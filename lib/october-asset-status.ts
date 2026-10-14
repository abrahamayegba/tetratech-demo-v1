import type { AssetInstance, AssetTest, TestResult } from "./types";

const PASS_COUNT = 226;
const SCHEDULED_COUNT = 45;
const FAIL_COUNT = 15;

export function getOctoberResult(index: number): TestResult {
  if (index < PASS_COUNT) return "pass";
  if (index < PASS_COUNT + SCHEDULED_COUNT) return "scheduled";
  if (index < PASS_COUNT + SCHEDULED_COUNT + FAIL_COUNT) return "fail";
  return "pending";
}

export function getOctoberAssetInstances(instances: AssetInstance[]): AssetInstance[] {
  return instances.map((instance, index) => {
    const result = getOctoberResult(index);
    return {
      ...instance,
      lastTestResult: result === "pending" ? undefined : result === "scheduled" ? "pending" : result,
      lastTestDate: result === "pass" || result === "fail" ? "2026-10-14" : undefined,
      nextTestDue: result === "scheduled" || result === "pending" ? "2026-10-28" : instance.nextTestDue,
    };
  });
}

export function getOctoberAssetTests(instances: AssetInstance[]): AssetTest[] {
  return instances.map((instance, index) => {
    const result = getOctoberResult(index);
    return {
      id: `oct_test_${String(index + 1).padStart(3, "0")}`,
      assetInstanceId: instance.id,
      testedBy: "Tetra Tech Compliance Team",
      testedByUserId: "usr_001",
      testDate: "2026-10-14",
      result,
      notes:
        result === "pass"
          ? "October compliance inspection passed."
          : result === "fail"
            ? "October compliance inspection failed; remedial action required."
            : result === "scheduled"
              ? "October compliance inspection scheduled."
              : "No October test recorded.",
      attachments: [],
      ...(result === "pass" || result === "fail" ? { certificateNumber: `CERT-OCT-${String(index + 1).padStart(3, "0")}` } : {}),
      nextTestDate: "2027-10-14",
      createdAt: "2026-10-14T00:00:00Z",
      updatedAt: "2026-10-14T00:00:00Z",
    };
  });
}

export const OCTOBER_SPLIT = {
  pass: PASS_COUNT,
  scheduled: SCHEDULED_COUNT,
  fail: FAIL_COUNT,
  noTest: 301 - PASS_COUNT - SCHEDULED_COUNT - FAIL_COUNT,
};
