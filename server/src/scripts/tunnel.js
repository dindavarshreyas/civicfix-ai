import localtunnel from 'localtunnel';

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: 4000 });
    console.log(`[TUNNEL ACTIVE] Your public URL is: ${tunnel.url}`);
    console.log(`[TUNNEL ACTIVE] API base URL: ${tunnel.url}/api/v1`);

    tunnel.on('close', () => {
      console.log('[TUNNEL] Tunnel closed. Reconnecting in 3s...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('[TUNNEL ERROR]', err.message);
      tunnel.close();
      setTimeout(startTunnel, 3000);
    });
  } catch (err) {
    console.error('[TUNNEL INIT ERROR]', err.message);
    setTimeout(startTunnel, 3000);
  }
}

// Keep event loop alive
setInterval(() => {}, 1000 * 60 * 60);

startTunnel();
