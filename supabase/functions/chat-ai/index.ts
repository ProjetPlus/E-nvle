import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { generateText } from "npm:ai";
import { z } from "npm:zod@3.25.76";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";

const models = {
  gemini: "google/gemini-3-flash-preview",
  gpt: "openai/gpt-5-mini",
  pro: "google/gemini-2.5-pro",
} as const;

const BodySchema = z.object({
  model: z.enum(["gemini", "gpt", "pro"]).default("gemini"),
  mode: z.enum(["assist", "auto_reply"]).default("assist"),
  messages: z.array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string().max(5000) })).min(1).max(30),
  language: z.string().default("fr"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400, headers: corsHeaders });
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return Response.json({ error: "LOVABLE_API_KEY manquante" }, { status: 500, headers: corsHeaders });
    const gateway = createLovableAiGatewayProvider(key);
    const system = parsed.data.mode === "auto_reply"
      ? `Tu rédiges une réponse courte et naturelle dans la langue ${parsed.data.language}, comme le propriétaire du compte. Ne mentionne jamais que tu es une IA.`
      : `Tu aides l'utilisateur à écrire un message clair dans la langue ${parsed.data.language}. Réponds uniquement par le texte prêt à envoyer.`;
    const result = await generateText({
      model: gateway(models[parsed.data.model]),
      system,
      messages: parsed.data.messages,
    });
    return Response.json({ text: result.text.trim(), model: models[parsed.data.model] }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erreur IA" }, { status: 500, headers: corsHeaders });
  }
});
