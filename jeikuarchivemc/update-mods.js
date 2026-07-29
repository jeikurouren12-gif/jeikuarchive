async function handleUpdateMods(context) {
  const { request, env } = context;
  const githubToken = env.GITHUB_TOKEN;
  const adminPassword = env.ADMIN_PASSWORD;

  if (!githubToken) {
    return new Response(JSON.stringify({ error: 'Missing GITHUB_TOKEN environment variable.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!adminPassword) {
    return new Response(JSON.stringify({ error: 'Missing ADMIN_PASSWORD environment variable.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const mods = body.mods;
    const providedPassword = body.password;

    if (providedPassword !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid admin password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!Array.isArray(mods)) {
      throw new Error('Invalid request body: mods must be an array.');
    }

    const repoOwner = 'M-E-N-A-C-E';
    const repoName = 'mcvaults';
    const branch = 'main';
    const filePath = 'data.json';

    const getResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'MCVaults Admin Panel'
      }
    });

    const getText = await getResponse.text();
    let currentFile;
    try {
      currentFile = getText ? JSON.parse(getText) : {};
    } catch (parseError) {
      throw new Error(`GitHub returned non-JSON response for file metadata: ${getText}`);
    }

    if (!getResponse.ok) {
      throw new Error(currentFile.message || `Unable to fetch current file info (${getResponse.status}): ${getText}`);
    }

    const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(mods, null, 2))));

    const updateResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'MCVaults Admin Panel',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update data.json via MCVaults admin panel',
        content: updatedContent,
        sha: currentFile.sha,
        branch
      })
    });

    const updateText = await updateResponse.text();
    let updateResult;
    try {
      updateResult = updateText ? JSON.parse(updateText) : {};
    } catch (parseError) {
      throw new Error(`GitHub returned non-JSON response: ${updateText}`);
    }

    if (!updateResponse.ok) {
      throw new Error(updateResult.message || `Failed to update data.json (${updateResponse.status}): ${updateText}`);
    }

    return new Response(JSON.stringify({ success: true, updated: updateResult.content }), {
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

  return handleUpdateMods(context);
}

export async function onRequestPost(context) {
  return handleUpdateMods(context);
}
