import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Automated accessibility gate.
 *
 * axe-core catches the mechanical failures (contrast, missing names, ARIA
 * misuse, landmark structure). It is not a substitute for the keyboard and
 * screen-reader checks in dashboard.spec.ts, but it stops regressions in the
 * things a human reviewer tends to miss.
 */
async function scan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
}

for (const path of ["/", "/orders", "/system"]) {
  test(`${path} has no detectable WCAG 2.1 A/AA violations (light)`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await scan(page);
    expect(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    ).toEqual([]);
  });

  test(`${path} has no detectable WCAG 2.1 A/AA violations (dark)`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() => {
      localStorage.setItem("pulseboard.theme", "dark");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveClass(/dark/);
    const results = await scan(page);
    expect(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    ).toEqual([]);
  });
}

test("the orders table is still accessible with filters applied and a dialog open", async ({ page }) => {
  await page.goto("/orders?status=refunded&pageSize=10");
  await page
    .getByRole("table")
    .locator("tbody tr")
    .first()
    .getByRole("button")
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const results = await scan(page);
  expect(
    results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
  ).toEqual([]);
});
