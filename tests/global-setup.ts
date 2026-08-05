import { chromium, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const STORAGE_STATE = path.join(process.cwd(), "tests/.auth/state.json");

/**
 * Réutilise la session Supabase existante (injectée par l'environnement Lovable)
 * pour éviter toute reconnexion manuelle pendant les tests E2E.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:8080";
  const storageKey = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY || "envle-one-auth-session";
  const sessionJson = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
  const cookiesJson = process.env.LOVABLE_BROWSER_SUPABASE_COOKIES_JSON;

  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();

  if (cookiesJson) {
    try {
      const cookies = JSON.parse(cookiesJson).map((c: Record<string, unknown>) => ({ ...c, url: baseURL }));
      await context.addCookies(cookies);
    } catch {
      /* cookies optionnels */
    }
  }

  const page = await context.newPage();
  await page.goto(baseURL, { waitUntil: "domcontentloaded" }).catch(() => undefined);

  if (sessionJson) {
    await page.evaluate(
      ([key, value]) => window.localStorage.setItem(key as string, value as string),
      [storageKey, sessionJson] as const,
    );
  }

  await context.storageState({ path: STORAGE_STATE });
  await browser.close();
}

export const hasSupabaseSession = () => Boolean(process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON);
