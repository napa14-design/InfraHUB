import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ResetBody = {
  userId?: string;
  newPassword?: string;
};

const allowedOrigins = (Deno.env.get("CORS_ORIGINS") || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const ADMIN_RATE_LIMIT_MAX = Number(Deno.env.get("ADMIN_FN_RATE_LIMIT_MAX") || "30");
const ADMIN_RATE_LIMIT_WINDOW_MS = Number(Deno.env.get("ADMIN_FN_RATE_LIMIT_WINDOW_MS") || "60000");
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const uuidV4Regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resolveCorsOrigin = (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  if (!origin) return "";
  if (!allowedOrigins.length) return origin;
  return allowedOrigins.includes(origin) ? origin : "";
};

const buildCorsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

const jsonResponse = (status: number, body: Record<string, unknown>, corsHeaders: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const extractClientIp = (req: Request) => {
  const xForwardedFor = req.headers.get("x-forwarded-for") || "";
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || "unknown";
};

const enforceRateLimit = (key: string) => {
  const now = Date.now();
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + ADMIN_RATE_LIMIT_WINDOW_MS });
    return { ok: true, retryAfterMs: ADMIN_RATE_LIMIT_WINDOW_MS };
  }

  if (current.count >= ADMIN_RATE_LIMIT_MAX) {
    return { ok: false, retryAfterMs: Math.max(0, current.resetAt - now) };
  }

  current.count += 1;
  rateLimitBuckets.set(key, current);
  return { ok: true, retryAfterMs: Math.max(0, current.resetAt - now) };
};

serve(async (req) => {
  const corsOrigin = resolveCorsOrigin(req);
  if (req.headers.get("Origin") && !corsOrigin) {
    return new Response("Origin not allowed", { status: 403 });
  }
  const corsHeaders = buildCorsHeaders(corsOrigin || "null");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, corsHeaders);
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(415, { error: "Content-Type must be application/json" }, corsHeaders);
  }

  const ip = extractClientIp(req);
  const ipRate = enforceRateLimit(`admin-reset-password:ip:${ip}`);
  if (!ipRate.ok) {
    return jsonResponse(429, { error: "Too many requests", retryAfterMs: ipRate.retryAfterMs }, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        500,
        { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        corsHeaders,
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return jsonResponse(401, { error: "Missing Authorization header" }, corsHeaders);
    }

    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) {
      return jsonResponse(401, { error: "Missing bearer token" }, corsHeaders);
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey || serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(accessToken);
    if (authError || !authData?.user) {
      return jsonResponse(401, { error: "Invalid or expired token" }, corsHeaders);
    }

    const userRate = enforceRateLimit(`admin-reset-password:user:${authData.user.id}`);
    if (!userRate.ok) {
      return jsonResponse(429, { error: "Too many requests", retryAfterMs: userRate.retryAfterMs }, corsHeaders);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
      .from("profiles")
      .select("role,name,email")
      .eq("id", authData.user.id)
      .single();

    if (requesterProfileError || !requesterProfile) {
      return jsonResponse(500, { error: "Failed to load requester profile" }, corsHeaders);
    }

    if (requesterProfile.role !== "ADMIN") {
      return jsonResponse(403, { error: "Only ADMIN can reset passwords" }, corsHeaders);
    }

    const body = (await req.json().catch(() => ({}))) as ResetBody;
    const userId = String(body.userId || "").trim();
    const newPassword = String(body.newPassword || "").trim();

    if (!userId || !newPassword) {
      return jsonResponse(400, { error: "Missing userId or newPassword" }, corsHeaders);
    }

    if (!uuidV4Regex.test(userId)) {
      return jsonResponse(400, { error: "Invalid userId format" }, corsHeaders);
    }

    if (newPassword.length < 6 || newPassword.length > 128) {
      return jsonResponse(400, { error: "Password must contain 6 to 128 characters" }, corsHeaders);
    }

    if (userId === authData.user.id) {
      return jsonResponse(403, { error: "You cannot reset your own password here" }, corsHeaders);
    }

    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id,name,email")
      .eq("id", userId)
      .maybeSingle();

    if (targetProfileError) {
      return jsonResponse(500, { error: "Failed to load target profile" }, corsHeaders);
    }

    if (!targetProfile) {
      return jsonResponse(404, { error: "Target user not found" }, corsHeaders);
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      return jsonResponse(400, { error: updateError.message || "Failed to update password" }, corsHeaders);
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ is_first_login: true })
      .eq("id", userId);

    if (profileUpdateError) {
      return jsonResponse(
        500,
        {
          error: "Password updated, but failed to flag first login",
        },
        corsHeaders,
      );
    }

    const requesterName =
      requesterProfile.name ||
      authData.user.user_metadata?.name ||
      authData.user.email ||
      authData.user.id;

    await supabaseAdmin.from("audit_logs").insert({
      user_id: authData.user.id,
      user_name: requesterName,
      user_role: requesterProfile.role,
      module: "ADMIN",
      action: "AUTH",
      target: `usuario ${targetProfile.email || userId}`,
      details: `Reset de senha administrativo. alvo_id=${userId}; alvo_nome=${targetProfile.name || "n/a"};`,
      timestamp: new Date().toISOString(),
    });

    return jsonResponse(200, { message: "Password updated" }, corsHeaders);
  } catch (error) {
    return jsonResponse(500, { error: error?.message || "Unexpected error" }, corsHeaders);
  }
});
