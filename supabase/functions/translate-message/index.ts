import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { generateText } from "npm:ai";
import { z } from "npm:zod@3.25.76";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const BodySchema = z.object({
  text: z.string().trim().min(1).max(5000),
  sourceLang: z.string().trim().min(2).max(12).optional(),
  targetLang: z.string().trim().min(2).max(12),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400, headers: corsHeaders });
    const { text, sourceLang, targetLang } = parsed.data;

    const deeplKey = Deno.env.get("DEEPL_API_KEY");
    if (deeplKey) {
      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: { Authorization: `DeepL-Auth-Key ${deeplKey}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ text, target_lang: targetLang.toUpperCase(), ...(sourceLang ? { source_lang: sourceLang.toUpperCase() } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) return Response.json({ error: data.message || "DeepL indisponible" }, { status: response.status, headers: corsHeaders });
      return Response.json({ translatedText: data.translations?.[0]?.text || text, provider: "deepl" }, { headers: corsHeaders });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return Response.json({ error: "LOVABLE_API_KEY manquante" }, { status: 500, headers: corsHeaders });
    const gateway = createLovableAiGatewayProvider(key);
    const result = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: "Tu es un moteur de traduction. Réponds uniquement avec le texte traduit, sans guillemets ni explication.",
      prompt: `Traduis ce message ${sourceLang ? `depuis ${sourceLang}` : "en détectant la langue"} vers ${targetLang}:\n\n${text}`,
    });
    return Response.json({ translatedText: result.text.trim(), provider: "lovable-ai" }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erreur traduction" }, { status: 500, headers: corsHeaders });
  }
});
