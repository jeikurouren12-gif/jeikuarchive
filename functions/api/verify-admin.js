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
  const body = await request.json().catch(() => null);
  const providedPassword = body?.password;

  if (!providedPassword || providedPassword !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ success: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
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

export async function onRequestOptions(context) {
  return createOptionsResponse();
}
