import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CreateUserBody = {
  user?: {
    email?: string;
    name?: string;
    role?: string;
    organizationId?: string | null;
    regionId?: string | null;
    sedeIds?: string[];
  };
  password?: string;
};

const allowedOrigins = (Deno.env.get("CORS_ORIGINS") || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedRoles = new Set(["ADMIN", "GESTOR", "OPERATIONAL"]);
const ADMIN_RATE_LIMIT_MAX = Number(Deno.env.get("ADMIN_FN_RATE_LIMIT_MAX") || "30");
const ADMIN_RATE_LIMIT_WINDOW_MS = Number(Deno.env.get("ADMIN_FN_RATE_LIMIT_WINDOW_MS") || "60000");
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

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
    return { ok: true, remaining: ADMIN_RATE_LIMIT_MAX - 1, retryAfterMs: ADMIN_RATE_LIMIT_WINDOW_MS };
  }

  if (current.count >= ADMIN_RATE_LIMIT_MAX) {
    return { ok: false, remaining: 0, retryAfterMs: Math.max(0, current.resetAt - now) };
  }

  current.count += 1;
  rateLimitBuckets.set(key, current);

  return {
    ok: true,
    remaining: Math.max(0, ADMIN_RATE_LIMIT_MAX - current.count),
    retryAfterMs: Math.max(0, current.resetAt - now),
  };
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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
  const ipRate = enforceRateLimit(`admin-create-user:ip:${ip}`);
  if (!ipRate.ok) {
    return jsonResponse(
      429,
      {
        error: "Too many requests",
        retryAfterMs: ipRate.retryAfterMs,
      },
      corsHeaders,
    );
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

    const userRate = enforceRateLimit(`admin-create-user:user:${authData.user.id}`);
    if (!userRate.ok) {
      return jsonResponse(
        429,
        {
          error: "Too many requests",
          retryAfterMs: userRate.retryAfterMs,
        },
        corsHeaders,
      );
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
      return jsonResponse(403, { error: "Only ADMIN can create users" }, corsHeaders);
    }

    const body = (await req.json().catch(() => ({}))) as CreateUserBody;
    const payload = body.user || {};
    const email = (payload.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const role = String(payload.role || "OPERATIONAL").trim().toUpperCase();
    const name = String(payload.name || "Novo usuario").trim();

    if (!email || !password) {
      return jsonResponse(400, { error: "Missing email or password" }, corsHeaders);
    }

    if (!isValidEmail(email)) {
      return jsonResponse(400, { error: "Invalid email format" }, corsHeaders);
    }

    if (!allowedRoles.has(role)) {
      return jsonResponse(400, { error: "Invalid role" }, corsHeaders);
    }

    if (name.length > 120) {
      return jsonResponse(400, { error: "Name is too long" }, corsHeaders);
    }

    if (password.length < 6) {
      return jsonResponse(400, { error: "Password must be at least 6 characters" }, corsHeaders);
    }

    if (payload.sedeIds && !Array.isArray(payload.sedeIds)) {
      return jsonResponse(400, { error: "sedeIds must be an array" }, corsHeaders);
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

    if (createError || !created?.user) {
      return jsonResponse(400, { error: createError?.message || "Failed to create user" }, corsHeaders);
    }

    const userId = created.user.id;

    const { error: profileInsertError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        email,
        name,
        role,
        organization_id: payload.organizationId || null,
        region_id: payload.regionId || null,
        sede_ids: payload.sedeIds || [],
        status: "ACTIVE",
        is_first_login: true,
      })
      .select()
      .single();

    if (profileInsertError) {
      return jsonResponse(500, { error: "Failed to create profile" }, corsHeaders);
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
      action: "CREATE",
      target: `usuario ${email}`,
      details: `Criacao de usuario. alvo_id=${userId}; alvo_nome=${name}; alvo_email=${email}; alvo_role=${role};`,
      timestamp: new Date().toISOString(),
    });

    return jsonResponse(200, { id: userId, email }, corsHeaders);
  } catch (error) {
    return jsonResponse(500, { error: error?.message || "Unexpected error" }, corsHeaders);
  }
});
