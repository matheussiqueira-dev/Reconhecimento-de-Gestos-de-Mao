import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/demo", "/dashboard", "/about"] as const;
const AXE_WIDTHS = [320, 768, 1280] as const;
const OVERFLOW_WIDTHS = [320, 375, 768, 1024, 1440] as const;

for (const route of ROUTES) {
  test.describe(`page ${route}`, () => {
    for (const width of AXE_WIDTHS) {
      test(`has no serious or critical axe violations at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        const blocking = results.violations.filter((violation) =>
          ["serious", "critical"].includes(violation.impact ?? ""),
        );
        expect(blocking.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
      });
    }

    test("never scrolls horizontally", async ({ page }) => {
      for (const width of OVERFLOW_WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(0);
      }
    });

    test("has the shared shell, one h1 and no console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      const external: string[] = [];
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (!["127.0.0.1", "localhost"].includes(url.hostname)) external.push(url.href);
      });

      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(route);

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main-content")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

      const footer = page.getByRole("contentinfo");
      await expect(footer.getByRole("link", { name: "Desenvolvido por Matheus Siqueira" })).toHaveAttribute(
        "href",
        "https://www.matheussiqueira.dev",
      );
      await expect(footer.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute(
        "href",
        "https://www.linkedin.com/in/matheussiqueira-dev",
      );
      await expect(footer.getByRole("link", { name: /^GitHub/ })).toHaveAttribute(
        "href",
        "https://github.com/matheussiqueira-dev",
      );

      // Every navigation link keeps an accessible name at 320 px.
      for (const link of await page.getByRole("banner").getByRole("link").all()) {
        expect((await link.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
      }

      expect(errors).toEqual([]);
      expect(external).toEqual([]);
    });

    test("the skip link moves focus to the main content", async ({ page }) => {
      await page.goto(route);
      await page.keyboard.press("Tab");
      const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
      await expect(skip).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("main#main-content")).toBeFocused();
    });
  });
}

test("SEO files and metadata are served from the app", async ({ page, request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/og.png", "/icon.svg"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\/.+\/og\.png$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\//);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
});

test("security headers are set and X-Powered-By is not", async ({ request }) => {
  const response = await request.get("/demo");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(headers["content-security-policy"]).toContain("'wasm-unsafe-eval'");
  expect(headers["permissions-policy"]).toContain("camera=(self)");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});
