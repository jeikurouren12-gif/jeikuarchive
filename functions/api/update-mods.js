export function createOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

async function getFileSha(owner, repo, path, branch, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'jeikuarchive-admin'
    }
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub get file failed: ${res.status}`);
  const data = await res.json();
  return data.sha;
}

async function updateGitHubFile(owner, repo, path, branch, token, contentString, message) {
  const sha = await getFileSha(owner, repo, path, branch, token);
  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const putBody = {
    message,
    content: encodeContent(contentString),
    branch
  };
  if (sha) putBody.sha = sha;

  const putRes = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'jeikuarchive-admin'
    },
    body: JSON.stringify(putBody)
  });

  const putText = await putRes.text();
  if (!putRes.ok) {
    throw new Error(`GitHub update failed for ${path}: ${putRes.status} ${putText}`);
  }

  return JSON.parse(putText);
}

function encodeContent(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return Buffer.from(str, 'utf8').toString('base64');
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  if (method === 'OPTIONS') return createOptionsResponse();

  if (method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  // Basic validation
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

  const categories = body.categories;
  if (categories !== undefined && (!Array.isArray(categories) || categories.some(category => typeof category !== 'string' || !category.trim()))) {
    return jsonResponse({ error: 'Invalid `categories` array' }, 400);
  }

  const owner = env.GITHUB_OWNER || env.GITHUB_REPO_OWNER || env.GITHUB_USER;
  const repo = env.GITHUB_REPO || env.GITHUB_REPOSITORY_NAME;
  const token = env.GITHUB_TOKEN;
  const branch = env.GITHUB_BRANCH || 'main';
  const filePath = env.FILE_PATH || 'data.json';
  const categoriesPath = env.CATEGORIES_FILE_PATH || 'categories.json';

  if (!owner || !repo || !token) {
    return jsonResponse({ error: 'Server misconfigured: missing GITHUB_OWNER, GITHUB_REPO, or GITHUB_TOKEN' }, 500);
  }

  try {
    const contentString = JSON.stringify(updatedMods, null, 2);
    const result = await updateGitHubFile(owner, repo, filePath, branch, token, contentString, `Update ${filePath} via admin panel`);
    let categoriesResult = null;
    if (categories !== undefined) {
      const categoriesContent = JSON.stringify([...new Set(categories.map(category => category.trim()))], null, 2);
      categoriesResult = await updateGitHubFile(owner, repo, categoriesPath, branch, token, categoriesContent, `Update ${categoriesPath} via admin panel`);
    }

    return jsonResponse({ success: true, result, categoriesResult }, 200);
  } catch (error) {
    return jsonResponse({ error: error.message }, 502);
  }
}

export async function onRequestOptions(context) {
  return createOptionsResponse();
}
