import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DeleteUserBody = {
  userId?: string;
};

const allowedOrigins = (Deno.env.get("CORS_ORIGINS") || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const resolveCorsOrigin = (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  if (!allowedOrigins.length) return "*";
  if (!origin) return allowedOrigins[0];
  return allowedOrigins.includes(origin) ? origin : "";
};

const buildCorsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

serve(async (req) => {
  const corsOrigin = resolveCorsOrigin(req);
  if (allowedOrigins.length && req.headers.get("Origin") && !corsOrigin) {
    return new Response("Origin not allowed", { status: 403 });
  }
  const corsHeaders = buildCorsHeaders(corsOrigin || "*");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Missing bearer token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey || serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } =
      await supabaseAuth.auth.getUser(accessToken);

    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ error: `Invalid or expired token: ${authError?.message || "unknown auth error"}` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role,name,email")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !requesterProfile) {
      return new Response(
        JSON.stringify({ error: "Failed to load requester profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (requesterProfile.role !== "ADMIN") {
      return new Response(
        JSON.stringify({ error: "Only ADMIN can delete users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json().catch(() => ({}))) as DeleteUserBody;
    const userId = (body.userId || "").trim();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (userId === authData.user.id) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id,role,status,name,email")
      .eq("id", userId)
      .maybeSingle();

    if (targetProfileError) {
      return new Response(
        JSON.stringify({ error: "Failed to load target profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Safety: do not allow deleting the last active ADMIN.
    if (targetProfile?.role === "ADMIN" && targetProfile?.status === "ACTIVE") {
      const { count: activeAdminCount, error: activeAdminCountError } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "ADMIN")
        .eq("status", "ACTIVE");

      if (activeAdminCountError) {
        return new Response(
          JSON.stringify({ error: "Failed to validate active admin count" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if ((activeAdminCount || 0) <= 1) {
        return new Response(
          JSON.stringify({ error: "Cannot delete the last active ADMIN" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    const authNotFound = !!deleteAuthError?.message &&
      deleteAuthError.message.toLowerCase().includes("not found");

    if (deleteAuthError && !authNotFound) {
      return new Response(
        JSON.stringify({ error: deleteAuthError.message || "Failed to delete auth user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const warnings: string[] = [];

    // Best effort cleanup in case profile row still exists.
    const { error: deleteProfileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (deleteProfileError) {
      warnings.push("Auth user deleted, but profile cleanup failed.");
    }

    const requesterName =
      requesterProfile?.name ||
      authData.user.user_metadata?.name ||
      authData.user.email ||
      authData.user.id;
    const targetEmail = targetProfile?.email || "";
    const targetName = targetProfile?.name || "";

    const { error: auditError } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: authData.user.id,
        user_name: requesterName,
        user_role: requesterProfile.role,
        module: "ADMIN",
        action: "DELETE",
        target: targetEmail ? `usuario ${targetEmail}` : `usuario ID ${userId}`,
        details: `Exclusao de usuario. alvo_id=${userId}; alvo_nome=${targetName || "n/a"}; alvo_email=${targetEmail || "n/a"};`,
        timestamp: new Date().toISOString(),
      });

    if (auditError && auditError.code !== "42P01") {
      warnings.push("User deleted, but failed to write audit log.");
    }

    return new Response(
      JSON.stringify({
        message: "User deleted",
        warning: warnings.length ? warnings.join(" ") : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
