// Cloudflare Pages Function for Decap CMS OAuth
// Handles the initial authorization request

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === '/oauth') {
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID');
    authUrl.searchParams.set('scope', 'repo,user');
    authUrl.searchParams.set('redirect_uri', `${url.origin}/oauth/callback`);

    return Response.redirect(authUrl.toString(), 302);
  }

  return new Response('Not found', { status: 404 });
}
