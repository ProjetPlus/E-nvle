import { expect, test } from "@playwright/test";

const authenticated = Boolean(process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON);

test.describe("Appels audio/vidéo (devices factices)", () => {
  test.skip(!authenticated, "Session Supabase requise (storageState)");

  test("les périphériques factices sont disponibles", async ({ page }) => {
    await page.goto("/app");
    const ok = await page.evaluate(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const has = stream.getAudioTracks().length > 0 && stream.getVideoTracks().length > 0;
        stream.getTracks().forEach((t) => t.stop());
        return has;
      } catch {
        return false;
      }
    });
    expect(ok).toBe(true);
  });

  test("l'écran d'appel s'ouvre et signale via Supabase", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/app");

    const callBtn = page.getByRole("button", { name: /📞|Appel audio/i }).first();
    if (!(await callBtn.isVisible().catch(() => false))) test.skip(true, "Aucune conversation ouverte");
    await callBtn.click();
    await expect(page.getByText(/Appel|Connexion/i).first()).toBeVisible({ timeout: 15000 });
    expect(errors.filter((e) => /row-level security|permission denied/i.test(e))).toEqual([]);
  });
});
