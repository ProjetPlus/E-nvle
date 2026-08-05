import { expect, test } from "@playwright/test";

test.describe("Gardes de routage & RLS", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of ["/app", "/profile", "/settings", "/calls"]) {
    test(`accès non authentifié à ${route} redirige vers /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/, { timeout: 15000 });
    });
  }

  test("les données protégées ne sont pas exposées sans session", async ({ page }) => {
    const url = process.env.VITE_SUPABASE_URL || "https://ewwlsgutjoouphvopzlt.supabase.co";
    const key =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3d2xzZ3V0am9vdXBodm9wemx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNTk3NjAsImV4cCI6MjA5ODczNTc2MH0.XIeGqgntDZKoKHpknCZ0c-CxIngNQFu99fuhgD9cYyc";

    for (const table of ["profiles", "conversations", "messages", "otp_codes"]) {
      const res = await page.request.get(`${url}/rest/v1/${table}?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      const body = res.ok() ? await res.json() : [];
      expect(Array.isArray(body) ? body.length : 0).toBe(0);
    }
  });
});
