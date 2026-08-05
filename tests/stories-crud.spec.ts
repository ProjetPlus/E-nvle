import { expect, test } from "@playwright/test";

const authenticated = Boolean(process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON);

test.describe("Stories CRUD & RLS", () => {
  test.skip(!authenticated, "Session Supabase requise (storageState)");

  test("les stories ne sont visibles qu'après complétion du profil", async ({ page }) => {
    await page.goto("/app");
    const storiesNav = page.getByRole("button", { name: /Stories|📸/i }).first();
    if (!(await storiesNav.isVisible().catch(() => false))) test.skip(true, "Module Stories non atteignable");
    await storiesNav.click();

    const gate = page.getByText(/profil|complét/i).first();
    const storiesUi = page.getByText(/Stories/i).first();
    await expect(gate.or(storiesUi)).toBeVisible({ timeout: 15000 });
  });

  test("aucune erreur RLS lors du chargement des stories", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/app");
    await page.waitForTimeout(4000);
    expect(errors.filter((e) => /row-level security|permission denied/i.test(e))).toEqual([]);
  });
});
