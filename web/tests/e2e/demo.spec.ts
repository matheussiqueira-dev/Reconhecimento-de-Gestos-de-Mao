import { expect, test, type ConsoleMessage } from "@playwright/test";
import { installStubs, pose, showPose, stubState } from "./stubs";

function collectConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test.describe("camera demo with golden fixtures", () => {
  test("shows the gesture and finger count for each fixture, and no gesture without a hand", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await installStubs(page);
    await page.goto("/demo");

    await page.getByRole("button", { name: "Ativar câmera" }).click();
    await expect(page.getByTestId("camera-status")).toHaveText("Reconhecimento ativo.");

    await expect(page.getByTestId("no-hand")).toContainText("Nenhuma mão detectada");
    await expect(page.getByText("Punho fechado")).toHaveCount(0);

    for (const id of ["peace-right", "open-palm-left", "ok-right", "pinch-right", "thumb-left"]) {
      const fixture = pose(id);
      await showPose(page, fixture);
      await expect(page.getByTestId(`gesture-${fixture.handedness}`)).toHaveText(fixture.expected.label);
      await expect(page.getByTestId(`fingers-${fixture.handedness}`)).toHaveText(
        String(fixture.expected.total),
      );
    }

    await showPose(page, null);
    await expect(page.getByTestId("no-hand")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("stop releases every camera track and closes the model; five start/stop cycles work", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await installStubs(page);
    await page.goto("/demo");

    for (let cycle = 1; cycle <= 5; cycle += 1) {
      await page.getByRole("button", { name: "Ativar câmera" }).click();
      await expect(page.getByTestId("camera-status")).toHaveText("Reconhecimento ativo.");
      await page.getByRole("button", { name: "Parar câmera" }).click();
      await expect(page.getByTestId("camera-status")).toHaveText("Câmera desligada.");

      const state = await stubState(page);
      expect(state.liveTracks).toBe(0);
      expect(state.created).toBe(cycle);
      expect(state.closed).toBe(cycle);
    }
    expect(errors).toEqual([]);
  });

  test("a denied permission shows the recovery steps and a retry, without console errors", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await installStubs(page, { deny: true });
    await page.goto("/demo");

    await page.getByRole("button", { name: "Ativar câmera" }).click();
    const alert = page.getByRole("region", { name: "Câmera" }).getByRole("alert");
    await expect(alert).toContainText("Permissão de câmera negada");
    await expect(alert.getByRole("listitem")).toHaveCount(3);
    await expect(alert.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("the session dashboard shows what the demo measured", async ({ page }) => {
    await installStubs(page);
    await page.goto("/demo");
    await page.getByRole("button", { name: "Ativar câmera" }).click();
    await expect(page.getByTestId("camera-status")).toHaveText("Reconhecimento ativo.");
    await showPose(page, pose("rock-right"));
    await expect(page.getByTestId("gesture-Right")).toHaveText("Rock");

    // Client-side navigation keeps the in-memory session.
    await page.getByRole("link", { name: "painel da sessão" }).click();
    // In a full parallel run the real-model test competes for CPU; give navigation room.
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 2, name: "Rock foi o gesto mais frequente" })).toBeVisible();
    await expect(page.getByText("Quadros processados", { exact: true })).toBeVisible();
  });

  test("a camera session loads no images or video from the network", async ({ page }) => {
    const mediaRequests: string[] = [];
    page.on("request", (request) => {
      if (["image", "media"].includes(request.resourceType())) mediaRequests.push(request.url());
    });
    await installStubs(page);
    await page.goto("/demo");
    mediaRequests.length = 0;

    await page.getByRole("button", { name: "Ativar câmera" }).click();
    await expect(page.getByTestId("camera-status")).toHaveText("Reconhecimento ativo.");
    await showPose(page, pose("four-right"));
    await page.waitForTimeout(3000);
    expect(mediaRequests).toEqual([]);
  });

  test("the real MediaPipe runtime loads under the CSP and processes camera frames", async ({ page }) => {
    // Needs network access to the model on storage.googleapis.com; the WASM comes from this app.
    test.setTimeout(120_000);
    const errors = collectConsoleErrors(page);
    const blocked: string[] = [];
    page.on("console", (message) => {
      if (/Content Security Policy|Refused to/i.test(message.text())) blocked.push(message.text());
    });
    const runtimeRequests: string[] = [];
    page.on("requestfinished", (request) => runtimeRequests.push(new URL(request.url()).pathname));

    await installStubs(page, { realModel: true });
    await page.goto("/demo");
    await page.getByRole("button", { name: "Ativar câmera" }).click();

    await expect(page.getByTestId("camera-status")).toHaveText("Reconhecimento ativo.", { timeout: 90_000 });
    // The synthetic camera shows no hand, so the real model must report none.
    await expect(page.getByTestId("no-hand")).toBeVisible();
    await expect(page.getByTestId("camera-stats")).toContainText("quadros/s");
    expect(runtimeRequests.some((path) => /^\/mediapipe\/0\.10\.35\/wasm\/vision_wasm/.test(path))).toBe(true);

    await page.getByRole("button", { name: "Parar câmera" }).click();
    await expect(page.getByTestId("camera-status")).toHaveText("Câmera desligada.");
    expect(blocked).toEqual([]);
    expect(errors).toEqual([]);
  });
});
