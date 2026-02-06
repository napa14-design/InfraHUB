import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ResetBody = {
  userId?: string;
  newPassword?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    const authHeaderPreview = req.headers.get("Authorization")
      ? "present"
      : "missing";
    console.log(`[admin-reset-password] ${requestId} auth: ${authHeaderPreview}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.log(`[admin-reset-password] ${requestId} missing env`);
      return json(500, {
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return json(401, { error: "Missing Authorization header" });
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey || serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !authData?.user) {
      console.log(`[admin-reset-password] ${requestId} getUser failed`, authError?.message);
      return json(401, { error: "Invalid or expired token" });
    }
    console.log(`[admin-reset-password] ${requestId} requester`, authData.user.id);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      console.log(`[admin-reset-password] ${requestId} profile error`, profileError?.message);
      return json(500, { error: "Failed to load requester profile" });
    }

    if (profile.role !== "ADMIN") {
      console.log(`[admin-reset-password] ${requestId} forbidden role`, profile.role);
      return json(403, { error: "Only ADMIN can reset passwords" });
    }

    const body = (await req.json().catch(() => ({}))) as ResetBody;
    const userId = body.userId;
    const newPassword = body.newPassword;

    if (!userId || !newPassword) {
      console.log(`[admin-reset-password] ${requestId} missing body`);
      return json(400, { error: "Missing userId or newPassword" });
    }

    if (newPassword.length < 6) {
      return json(400, { error: "Password must be at least 6 characters" });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword },
    );

    if (updateError) {
      console.log(`[admin-reset-password] ${requestId} update error`, updateError.message);
      return json(400, { error: updateError.message });
    }

    console.log(`[admin-reset-password] ${requestId} success`);
    return json(200, { message: "Password updated" });
  } catch (error) {
    console.log(`[admin-reset-password] unexpected error`, error?.message);
    return json(500, { error: error?.message || "Unexpected error" });
  }
});
