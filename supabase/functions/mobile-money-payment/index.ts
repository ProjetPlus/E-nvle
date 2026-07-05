import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const BodySchema = z.object({
  provider: z.enum(["orange_money", "wave", "mtn", "moov", "manual"]),
  phone: z.string().trim().min(8).max(24),
  amount: z.number().positive().max(10_000_000),
  currency: z.string().trim().min(3).max(6).default("XOF"),
  description: z.string().trim().max(240).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400, headers: corsHeaders });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData.user) return Response.json({ error: "Non authentifié" }, { status: 401, headers: corsHeaders });

    const reference = `ENVLE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: userData.user.id,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      type: "credit",
      status: "pending",
      description: `${parsed.data.provider} · ${parsed.data.description || "Recharge Mobile Money"} · ${reference}`,
    });
    if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    return Response.json({ success: true, status: "pending", reference, provider: parsed.data.provider }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erreur paiement" }, { status: 500, headers: corsHeaders });
  }
});
