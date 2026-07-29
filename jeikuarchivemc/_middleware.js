export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const shouldRedirectHost = url.hostname === 'jeikuarchive.pages.dev' || url.hostname === 'www.jeikuarchive.com';

  if (shouldRedirectHost) {
    const targetUrl = new URL(request.url);
    targetUrl.hostname = 'www.jeikuarchive.com';
    targetUrl.protocol = 'https:';

    if (targetUrl.pathname === '/admin' || targetUrl.pathname === '/admin/') {
      targetUrl.pathname = '/admin/';
    }

    return Response.redirect(targetUrl, 301);
  }

  return next();
}
