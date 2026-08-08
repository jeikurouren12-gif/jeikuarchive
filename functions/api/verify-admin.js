const RATE_LIMIT_WINDOW_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;
const globalRateLimitStore = globalThis.__adminRateLimitStore || (globalThis.__adminRateLimitStore = new Map());

async function getRateLimitState(env, key) {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
  let record = null;

  if (env.ADMIN_RATE_LIMIT_KV) {
    const stored = await env.ADMIN_RATE_LIMIT_KV.get(key, { type: 'json' });
    record = stored ? JSON.parse(stored) : null;
  } else {
    record = globalRateLimitStore.get(key);
  }

  if (!record || record.expiresAt <= now) {
    record = { count: 0, expiresAt: now + windowMs };
  }

  return record;
}

async function saveRateLimitState(env, key, record) {
  if (env.ADMIN_RATE_LIMIT_KV) {
    await env.ADMIN_RATE_LIMIT_KV.put(key, JSON.stringify(record), {
      expirationTtl: RATE_LIMIT_WINDOW_SECONDS
    });
    return;
  }

  globalRateLimitStore.set(key, record);
}

function createOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

async function handleVerifyAdmin(context) {
  const { request, env } = context;
  const adminPassword = env.ADMIN_PASSWORD;
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]
    || 'unknown';
  const rateLimitKey = `verify-admin:${ip}`;

  if (!adminPassword) {
    return new Response(JSON.stringify({ error: 'Missing ADMIN_PASSWORD environment variable.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const providedPassword = body.password;

    if (typeof providedPassword !== 'string') {
      return new Response(JSON.stringify({ success: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const state = await getRateLimitState(env, rateLimitKey);
    if (state.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.max(1, Math.ceil((state.expiresAt - Date.now()) / 1000));
      return new Response(JSON.stringify({ success: false, error: 'Too many password attempts. Please wait a few minutes and try again.', retryAfter }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter)
        }
      });
    }

    const success = providedPassword === adminPassword;
    if (!success) {
      state.count += 1;
      await saveRateLimitState(env, rateLimitKey, state);
    }

    return new Response(JSON.stringify({ success }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequest(context) {
  const method = context.request.method.toUpperCase();
  if (method === 'OPTIONS') {
    return createOptionsResponse();
  }

  if (method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return handleVerifyAdmin(context);
}

export async function onRequestPost(context) {
  return handleVerifyAdmin(context);
}

export async function onRequestOptions(context) {
  return createOptionsResponse();
}
