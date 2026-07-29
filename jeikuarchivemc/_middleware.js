export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const shouldRedirectHost = url.hostname === 'mcvaults.pages.dev' || url.hostname === 'www.mcvaults.com';

  if (shouldRedirectHost) {
    const targetUrl = new URL(request.url);
    targetUrl.hostname = 'mcvaults.com';
    targetUrl.protocol = 'https:';

    if (targetUrl.pathname === '/admin' || targetUrl.pathname === '/admin/') {
      targetUrl.pathname = '/admin/';
    }

    return Response.redirect(targetUrl, 301);
  }

  return next();
}
