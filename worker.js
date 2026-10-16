const ALLOWED_ORIGIN = "https://johnztrueorganics.org";

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  });
}

function originFor(request) {
  const origin = request.headers.get("Origin");
  return origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
}

function supabaseHeaders(env) {
  return {
    apikey: env.SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`,
    "content-type": "application/json",
  };
}

async function handleProducts(env, request) {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    return json({ error: "Backend is not configured" }, 503, originFor(request));
  }

  const url = new URL(env.SUPABASE_URL);
  url.pathname = "/rest/v1/products";
  url.search = new URLSearchParams({
    select: "id,sku,name,slug,description,price_zar_cents,active",
    active: "eq.true",
    order: "name.asc",
  });

  const response = await fetch(url, { headers: supabaseHeaders(env) });
  if (!response.ok) return json({ error: "Unable to load products" }, 502, originFor(request));
  return new Response(await response.text(), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=300",
      "access-control-allow-origin": originFor(request),
      "x-content-type-options": "nosniff",
    },
  });
}

function validText(value, max) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

async function handleApplication(env, request) {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    return json({ error: "Backend is not configured" }, 503, originFor(request));
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return json({ error: "JSON request required" }, 415, originFor(request));
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, originFor(request));
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!validText(body.full_name, 120) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "Name and valid email are required" }, 400, originFor(request));
  }
  if (body.phone !== undefined && body.phone !== null && !validText(String(body.phone), 40)) {
    return json({ error: "Phone is invalid" }, 400, originFor(request));
  }
  if (body.city !== undefined && body.city !== null && !validText(String(body.city), 100)) {
    return json({ error: "City is invalid" }, 400, originFor(request));
  }
  if (body.message !== undefined && body.message !== null && !validText(String(body.message), 2000)) {
    return json({ error: "Message is invalid" }, 400, originFor(request));
  }

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/applications`, {
    method: "POST",
    headers: { ...supabaseHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify({
      full_name: body.full_name.trim(),
      email,
      phone: body.phone ? String(body.phone).trim() : null,
      city: body.city ? String(body.city).trim() : null,
      message: body.message ? String(body.message).trim() : null,
    }),
  });

  if (!response.ok) return json({ error: "Application could not be submitted" }, 502, originFor(request));
  return json({ ok: true }, 201, originFor(request));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-max-age": "86400",
        },
      });
    }

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return json({ ok: true, service: "johnztrueorganics-api" }, 200, originFor(request));
      }
      if (url.pathname === "/api/products" && request.method === "GET") {
        return handleProducts(env, request);
      }
      if (url.pathname === "/api/applications" && request.method === "POST") {
        return handleApplication(env, request);
      }
      if (url.pathname.startsWith("/api/")) {
        return json({ error: "Not found" }, 404, originFor(request));
      }

      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      headers.set("x-content-type-options", "nosniff");
      headers.set("referrer-policy", "strict-origin-when-cross-origin");
      headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      console.error("request_failed", error);
      return json({ error: "Internal server error" }, 500, originFor(request));
    }
  },
};
