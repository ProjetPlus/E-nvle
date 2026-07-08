import { expect, test } from "@playwright/test";

test.describe("E'nvlé One critical access flows", () => {
  test("unauthenticated users stay on mandatory phone sign-in", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Connexion par numéro de téléphone")).toBeVisible();
    await expect(page.getByLabel("Numéro téléphone").or(page.locator('input[type="tel"]'))).toBeVisible();
    await expect(page.getByText("Messages")).not.toBeVisible();
  });

  test("locked routes redirect to login when no session exists", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Connexion par numéro de téléphone")).toBeVisible();
  });

  test("login page exposes signup, device pairing and profile persistence promises", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("Connexion par numéro de téléphone")).toBeVisible();
    await expect(page.getByText("Session conservée jusqu'à déconnexion manuelle")).toBeVisible();
    await expect(page.getByRole("button", { name: /Connecter second appareil par QR/i })).toBeVisible();
  });
});
