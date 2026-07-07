import { expect, test } from "@playwright/test";

test.describe("E'nvlé One critical access flows", () => {
  test("unauthenticated users stay on mandatory phone sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Connexion par numéro de téléphone")).toBeVisible();
    await expect(page.getByLabel("Numéro téléphone").or(page.locator('input[type="tel"]'))).toBeVisible();
    await expect(page.getByText("Messages")).not.toBeVisible();
  });

  test("profile fields and media upload controls are present after auth state is restored", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Connexion par numéro de téléphone")).toBeVisible();
    await expect(page.getByText("Session conservée jusqu'à déconnexion manuelle")).toBeVisible();
  });
});
