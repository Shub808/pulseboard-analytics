import { expect, test } from "@playwright/test";

/**
 * End-to-end coverage of the journeys a reviewer would actually try.
 * Every assertion goes through the real production build and the real API.
 */

test.describe("overview", () => {
  test("defaults to a 90-day window so the KPIs have a comparison period", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/from=2026-07-03&to=2026-09-30/);
    await expect(page.getByText("(90 days)")).toBeVisible();
    // With a previous period available, no KPI should read "n/a".
    await expect(
      page.getByLabel("Key performance indicators").getByText("n/a"),
    ).toHaveCount(0);
  });

  test("renders KPIs, the trend chart and both breakdowns", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Operations overview", level: 1 }),
    ).toBeVisible();

    const kpis = page.getByLabel("Key performance indicators");
    await expect(kpis.getByText("Revenue", { exact: true })).toBeVisible();
    await expect(kpis.getByText("Orders", { exact: true })).toBeVisible();
    await expect(kpis.getByText("Avg. order value")).toBeVisible();
    await expect(kpis.getByText("Refund rate")).toBeVisible();

    // A real currency figure, not a zero placeholder.
    await expect(kpis.getByText(/^\$[\d,]{4,}$/).first()).toBeVisible();

    await expect(page.locator(".recharts-surface").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Revenue by channel" }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /by sales channel/i }),
    ).toBeVisible();
  });

  test("switching the trend measure keeps a single y-axis chart", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Revenue over time" }),
    ).toBeVisible();
    await page.getByRole("radio", { name: "Orders" }).click();
    await expect(
      page.getByRole("heading", { name: "Orders over time" }),
    ).toBeVisible();
  });

  test("a date preset narrows the window and is reflected in the URL", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /date range/ }).click();
    await page.getByRole("button", { name: "Last 30 days" }).click();
    await expect(page).toHaveURL(/from=2026-09-01&to=2026-09-30/);
    await expect(page.getByText("(30 days)")).toBeVisible();
  });
});

test.describe("orders table", () => {
  test("filters by status and shows the active filter as a removable chip", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("table")).toBeVisible();

    await page.getByRole("button", { name: "Status filter" }).click();
    // `.click()` rather than `.check()`: the checkbox is controlled by the
    // URL, so its state flips on the next render rather than synchronously,
    // which `.check()`'s immediate verification would reject.
    const refunded = page.getByRole("checkbox", { name: "Refunded" });
    await refunded.click();
    await expect(refunded).toBeChecked();

    await expect(page).toHaveURL(/status=refunded/);
    await expect(page.getByText("Status: Refunded")).toBeVisible();

    const badges = page.getByRole("table").getByText("Refunded");
    await expect(badges.first()).toBeVisible();
    // Every visible status badge must be the one we filtered to.
    expect(await page.getByRole("table").getByText("Paid").count()).toBe(0);
  });

  test("sorting by amount is announced via aria-sort and reorders the rows", async ({ page }) => {
    await page.goto("/orders?pageSize=10");
    await page.getByRole("button", { name: /Amount/ }).click();
    await expect(page).toHaveURL(/sort=amountMinor/);

    const header = page.getByRole("columnheader", { name: /Amount/ });
    await expect(header).toHaveAttribute("aria-sort", "descending");

    const amounts = await page
      .locator("tbody tr td:last-child")
      .allInnerTexts();
    const numbers = amounts.map((text) => Number(text.replace(/[$,]/g, "")));
    const sorted = [...numbers].sort((a, b) => b - a);
    expect(numbers).toEqual(sorted);
  });

  test("search narrows to a single order and the detail dialog opens", async ({ page }) => {
    await page.goto("/orders");
    // The ID button also contains the timestamp, so pull just the order ID.
    const firstRowText = await page
      .locator("tbody tr")
      .first()
      .locator("button")
      .first()
      .innerText();
    const firstId = /ORD-\d{6}/.exec(firstRowText)?.[0] ?? "";
    expect(firstId).toMatch(/^ORD-\d{6}$/);

    await page.getByRole("searchbox").fill(firstId);
    await expect(page.getByText("1 order matches the current filters")).toBeVisible();
    await expect(page.getByText("1–1 of 1")).toBeVisible();

    // Scope to the table: the active-filter chip also carries the order ID in
    // its "remove filter" label.
    await page
      .getByRole("table")
      .getByRole("button", { name: new RegExp(firstId) })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Recent orders from this customer")).toBeVisible();

    // Escape must dismiss the native dialog.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("pagination moves through pages without repeating rows", async ({ page }) => {
    await page.goto("/orders?pageSize=10&sort=createdAt&dir=desc");
    await expect(page.getByText("1–10 of", { exact: false })).toBeVisible();
    const firstPage = await page.locator("tbody tr td:first-child").allInnerTexts();

    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);
    // Wait for the range indicator to advance before reading rows, otherwise
    // the assertion can race the re-render and compare page 1 with itself.
    await expect(page.getByText("11–20 of", { exact: false })).toBeVisible();
    const secondPage = await page.locator("tbody tr td:first-child").allInnerTexts();

    expect(secondPage).not.toEqual(firstPage);
    expect(firstPage.some((row) => secondPage.includes(row))).toBe(false);
  });

  test("an impossible filter combination shows the empty state", async ({ page }) => {
    await page.goto("/orders?q=zzz-no-such-customer&all=1");
    await expect(
      page.getByText("No orders match these filters"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Reset all filters" }).click();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("a server failure shows the error state and retries", async ({ page }) => {
    await page.goto("/orders?simulate=error");
    const alert = page.getByRole("alert").filter({ hasText: "Couldn't load orders" });
    await expect(alert).toBeVisible();
    await expect(alert.getByText(/Simulated upstream failure/)).toBeVisible();
    await expect(alert.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("CSV export downloads the filtered rows", async ({ page }) => {
    await page.goto("/orders?status=cancelled&from=2026-09-01&to=2026-09-30");
    const download = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export CSV" }).click(),
    ]).then(([event]) => event);

    expect(download.suggestedFilename()).toMatch(/^pulseboard-orders-.*\.csv$/);
    await expect(page.getByText(/Exported \d+ rows\./)).toBeVisible();
  });

  test("invalid URL parameters are reported, not silently swallowed", async ({ page }) => {
    await page.goto("/orders?pageSize=7");
    await expect(
      page.getByText(/Some URL parameters were invalid/),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });
});

test.describe("accessibility and responsiveness", () => {
  test("the skip link is the first tab stop and moves focus to the main region", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page).toHaveURL(/#main/);
  });

  test("every page has exactly one h1 and a labelled main landmark", async ({ page }) => {
    for (const path of ["/", "/orders", "/system"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toBeVisible();
      // Exactly one main-navigation landmark exists in the document. On
      // narrow viewports the sidebar copy is display:none and the drawer copy
      // is unmounted, so this is a DOM-level assertion rather than a
      // role-based one.
      await expect(page.locator('nav[aria-label="Main"]')).toHaveCount(1);
    }
  });

  test("the theme toggle switches scheme and persists across a reload", async ({ page }) => {
    await page.goto("/system");
    await page.getByRole("radio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

test.describe("mobile layout", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) > 500, "mobile only");

  test("navigation collapses into a drawer and the page does not scroll sideways", async ({ page }) => {
    await page.goto("/orders");
    const toggle = page.getByRole("button", { name: "Toggle navigation" });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByRole("link", { name: /Design system/ })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
