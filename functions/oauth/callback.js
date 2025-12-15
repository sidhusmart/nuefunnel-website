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

    // Format token for Decap CMS (expects { token, provider } not { access_token, token_type })
    const formattedToken = {
      token: tokenData.access_token,
      provider: 'github',
    };

    // Return success page with token
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Authorization Success</title>
          <script>
            (function() {
              // Token data injected from server
              const token = ${JSON.stringify(formattedToken)};

              console.log('[OAuth Callback] Starting OAuth callback handler');
              console.log('[OAuth Callback] Token for Decap CMS:', token);

              function receiveMessage(e) {
                console.log('[OAuth Callback] Received message from parent:', e.data);

                if (e.data === 'authorizing:github') {
                  const message = 'authorization:github:success:' + JSON.stringify(token);
                  console.log('[OAuth Callback] Sending success message to parent:', message);

                  window.opener.postMessage(message, e.origin);
                  window.removeEventListener('message', receiveMessage, false);

                  // Close window after successful message transmission
                  console.log('[OAuth Callback] Closing popup window in 1 second');
                  setTimeout(() => {
                    window.close();
                  }, 1000);
                }
              }

              window.addEventListener('message', receiveMessage, false);

              // Initiate handshake with parent window
              console.log('[OAuth Callback] Sending initial handshake to parent');
              window.opener.postMessage('authorizing:github', '*');

              // Fallback: close window after 5 seconds if not closed already
              setTimeout(() => {
                console.log('[OAuth Callback] Timeout reached, closing window');
                window.close();
              }, 5000);
            })();
          </script>
        </head>
        <body>
          <p>Authorization successful. This window will close automatically...</p>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new Response('Not found', { status: 404 });
}
