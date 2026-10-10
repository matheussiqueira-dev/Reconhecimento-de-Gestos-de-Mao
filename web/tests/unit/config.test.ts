import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MEDIAPIPE_VERSION, MODEL_ORIGIN, MODEL_URL, WASM_BASE_PATH } from "@/lib/mediapipe/config";

const read = (relative: string) => readFileSync(new URL(relative, import.meta.url));

describe("MediaPipe runtime", () => {
  it("serves the WASM version pinned in package.json", () => {
    const pkg = JSON.parse(read("../../package.json").toString("utf8")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies["@mediapipe/tasks-vision"]).toBe(MEDIAPIPE_VERSION);
    expect(WASM_BASE_PATH).toBe(`/mediapipe/${MEDIAPIPE_VERSION}/wasm`);
  });

  it("loads the model from the origin allowed by the CSP", () => {
    expect(new URL(MODEL_URL).origin).toBe(MODEL_ORIGIN);
  });
});

describe("design tokens", () => {
  it("keeps ms-tokens.css byte-identical to the shared v1.0 file", () => {
    const digest = createHash("sha256").update(read("../../src/app/ms-tokens.css")).digest("hex");
    expect(digest).toBe("4ee1fcd1e10a7592079aebe6ba675cf46d971ae3fdce64b54efadedef1a4fe99");
  });
});
