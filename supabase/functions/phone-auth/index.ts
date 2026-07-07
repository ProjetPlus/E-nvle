import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), phone: z.string().min(8).max(24) }),
  z.object({ action: z.literal("verify"), phone: z.string().min(8).max(24), code: z.string().regex(/^\d{6}$/), fullName: z.string().trim().max(120).optional() }),
]);

const normalizePhone = (value: string) => value.replace(/[^+\d]/g, "").replace(/^00/, "+");
const phoneEmail = async (phone: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(phone));
  const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  return `phone-${hash}@auth.envle.local`;
};
const password = () => crypto.randomUUID() + crypto.randomUUID();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const phone = normalizePhone(parsed.data.phone);
    const email = await phoneEmail(phone);

    if (parsed.data.action === "request") {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const { error } = await supabase.from("otp_codes").insert({ email: phone, code, expires_at: new Date(Date.now() + 5 * 60_000).toISOString() });
      if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
      return Response.json({ success: true, code, expiresIn: 300 }, { headers: corsHeaders });
    }

    const { data: otp, error: otpError } = await supabase
      .from("otp_codes")
      .select("id, expires_at, is_used, attempts")
      .eq("email", phone)
      .eq("code", parsed.data.code)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (otpError) return Response.json({ error: otpError.message }, { status: 500, headers: corsHeaders });
    if (!otp) return Response.json({ error: "Code invalide" }, { status: 401, headers: corsHeaders });
    if (new Date(otp.expires_at).getTime() < Date.now()) return Response.json({ error: "Code expiré" }, { status: 401, headers: corsHeaders });

    await supabase.from("otp_codes").update({ is_used: true }).eq("id", otp.id);

    const tempPassword = password();
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing.users.find((u) => u.email === email);
    const userResult = found
      ? await supabase.auth.admin.updateUserById(found.id, { password: tempPassword, phone, user_metadata: { phone } })
      : await supabase.auth.admin.createUser({ email, password: tempPassword, email_confirm: true, phone, phone_confirm: true, user_metadata: { phone } });
    if (userResult.error || !userResult.data.user) return Response.json({ error: userResult.error?.message || "Création impossible" }, { status: 500, headers: corsHeaders });

    const userId = userResult.data.user.id;
    await supabase.from("profiles").upsert({
      id: userId,
      phone,
      email: null,
      full_name: parsed.data.fullName?.trim() || `Utilisateur ${phone.slice(-4)}`,
      username: `envle_${phone.slice(-6)}`,
      status: "online",
      last_seen: new Date().toISOString(),
    }, { onConflict: "id" });

    return Response.json({ success: true, email, password: tempPassword, userId }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500, headers: corsHeaders });
  }
});
