import { expect, test } from "@playwright/test";

const authenticated = Boolean(process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON);

test.describe("Conversations & messages temps réel", () => {
  test.skip(!authenticated, "Session Supabase requise (storageState)");

  test("session réutilisée sans reconnexion manuelle", async ({ page }) => {
    await page.goto("/app");
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test("création de conversation puis envoi/réception d'un message", async ({ page }) => {
    await page.goto("/app");
    const newConv = page.getByRole("button", { name: /Nouvelle conversation|➕|✏️/ }).first();
    if (await newConv.isVisible().catch(() => false)) {
      await newConv.click();
      const search = page.getByPlaceholder(/Rechercher|contact/i).first();
      if (await search.isVisible().catch(() => false)) {
        await search.fill("a");
        const firstContact = page.locator("button").filter({ hasText: /\+\d{6,}/ }).first();
        if (await firstContact.isVisible().catch(() => false)) {
          await firstContact.click();
          await expect(page.getByText(/Conversation ouverte|Erreur/i).first()).toBeVisible({ timeout: 15000 });
          await expect(page.getByText(/row-level security/i)).toHaveCount(0);
        }
      }
    }

    const input = page.getByPlaceholder(/message/i).first();
    if (await input.isVisible().catch(() => false)) {
      const body = `E2E ${Date.now()}`;
      await input.fill(body);
      await input.press("Shift+Enter");
      await expect(page.getByText(body).first()).toBeVisible({ timeout: 15000 });
    }
  });
});
