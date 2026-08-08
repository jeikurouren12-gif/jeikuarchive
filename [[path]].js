const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function createOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

async function getFileSha(owner, repo, path, branch, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub get file failed: ${res.status}`);
  const data = await res.json();
  return data.sha;
}

function encodeContent(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return Buffer.from(str, 'utf8').toString('base64');
  }
}

async function handleVerifyAdmin(request, env) {
  if (request.method === 'OPTIONS') return createOptionsResponse();
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const body = await request.json().catch(() => null);
  if (!body?.password || body.password !== env.ADMIN_PASSWORD) {
    return jsonResponse({ success: false }, 401);
  }

  return jsonResponse({ success: true });
}

async function handleUpdateMods(request, env) {
  if (request.method === 'OPTIONS') return createOptionsResponse();
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const body = await request.json().catch(() => null);
  if (!body) return jsonResponse({ error: 'Invalid JSON body' }, 400);

  const providedPassword = body.password;
  if (!providedPassword || providedPassword !== env.ADMIN_PASSWORD) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const updatedMods = body.mods;
  if (!Array.isArray(updatedMods)) {
    return jsonResponse({ error: 'Missing or invalid `mods` array' }, 400);
  }

  const owner = env.GITHUB_OWNER || env.GITHUB_REPO_OWNER || env.GITHUB_USER;
  const repo = env.GITHUB_REPO || env.GITHUB_REPOSITORY_NAME;
  const token = env.GITHUB_TOKEN;
  const branch = env.GITHUB_BRANCH || 'main';
  const filePath = env.FILE_PATH || 'data.json';

  if (!owner || !repo || !token) {
    return jsonResponse({ error: 'Server misconfigured: missing GITHUB_OWNER, GITHUB_REPO, or GITHUB_TOKEN' }, 500);
  }

  try {
    const sha = await getFileSha(owner, repo, filePath, branch, token);
    const contentString = JSON.stringify(updatedMods, null, 2);
    const encoded = encodeContent(contentString);

    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;
    const putBody = {
      message: `Update ${filePath} via admin panel`,
      content: encoded,
      branch
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    const putText = await putRes.text();
    if (!putRes.ok) {
      return jsonResponse({ error: `GitHub update failed: ${putRes.status}`, details: putText }, 502);
    }

    return jsonResponse({ success: true, result: JSON.parse(putText) }, 200);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === '/api/verify-admin') {
    return handleVerifyAdmin(request, env);
  }

  if (pathname === '/api/update-mods') {
    return handleUpdateMods(request, env);
  }

  if (url.hostname === 'jeikuarchive.pages.dev' || url.hostname === 'www.jeikuarchive.com') {
    url.hostname = 'www.jeikuarchive.com';
    return Response.redirect(url, 301);
  }

  const response = await next();

  if (response.status === 404) {
    const indexUrl = new URL('/index.html', request.url);
    const indexResponse = await fetch(indexUrl);

    if (indexResponse.ok) {
      return new Response(indexResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
    }
  }

  return response;
}
