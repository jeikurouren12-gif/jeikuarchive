export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (url.hostname === 'mcvaults.pages.dev' || url.hostname === 'www.mcvaults.com') {
    url.hostname = 'mcvaults.com';
    return Response.redirect(url, 301);
  }

  if (pathname.startsWith('/api/') || pathname.startsWith('/admin/')) {
    return next();
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
