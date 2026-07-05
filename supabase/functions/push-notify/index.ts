import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const BodySchema = z.object({
  userId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(500).default(""),
  type: z.string().trim().max(40).default("system"),
  icon: z.string().trim().max(16).default("🔔"),
  data: z.record(z.unknown()).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400, headers: corsHeaders });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from("notifications").insert({
      user_id: parsed.data.userId,
      title: parsed.data.title,
      body: parsed.data.body,
      type: parsed.data.type,
      icon: parsed.data.icon,
      data: parsed.data.data || {},
    });
    if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erreur notification" }, { status: 500, headers: corsHeaders });
  }
});