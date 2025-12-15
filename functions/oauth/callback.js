// Cloudflare Pages Function for Decap CMS OAuth
// This acts as an OAuth proxy for GitHub authentication

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Handle OAuth callback from GitHub
  if (url.pathname === '/oauth/callback') {
    const code = url.searchParams.get('code');

    if (!code) {
      return new Response('Missing code parameter', { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(JSON.stringify(tokenData), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return success page with token
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Authorization Success</title>
          <script>
            (function() {
              function receiveMessage(e) {
                window.opener.postMessage(
                  \`authorization:github:success:\${JSON.stringify(tokenData)}\`,
                  e.origin
                );
                window.removeEventListener('message', receiveMessage, false);
              }
              window.addEventListener('message', receiveMessage, false);
              window.opener.postMessage('authorizing:github', '*');
            })();
          </script>
        </head>
        <body>
          <p>Authorization successful. You can close this window.</p>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new Response('Not found', { status: 404 });
}
