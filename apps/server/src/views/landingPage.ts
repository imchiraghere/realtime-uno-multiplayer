export function renderLandingPage(config: {
  port: number;
  nodeEnv: string;
  clientUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Uno Online — Backend Server</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23ef4444'/><text y='65' x='50' text-anchor='middle' font-size='38' font-weight='900' fill='white' font-family='sans-serif'>UNO</text></svg>" />
  <style>
    :root {
      --bg: #09090b;
      --card-bg: rgba(24, 24, 27, 0.7);
      --border: rgba(255, 255, 255, 0.08);
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --red: #ef4444;
      --blue: #3b82f6;
      --green: #22c55e;
      --yellow: #eab308;
      --purple: #a855f7;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      background: radial-gradient(circle at 50% 0%, #1f1220 0%, var(--bg) 75%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 40px 20px;
    }

    .container {
      width: 100%;
      max-width: 820px;
    }

    /* Brand Header */
    .header {
      text-align: center;
      margin-bottom: 32px;
    }

    .cards-deck-badge {
      display: inline-flex;
      gap: 6px;
      margin-bottom: 16px;
      transform: rotate(-2deg);
    }

    .mini-card {
      width: 24px;
      height: 36px;
      border-radius: 6px;
      border: 2px solid #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 11px;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      transition: transform 0.2s;
    }
    .mini-card:hover { transform: translateY(-4px) scale(1.1); }
    .card-r { background: var(--red); }
    .card-y { background: var(--yellow); color: #000; }
    .card-g { background: var(--green); }
    .card-b { background: var(--blue); }

    .title {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .title .accent {
      color: var(--red);
      background: linear-gradient(135deg, #ef4444, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 15px;
      margin-top: 8px;
    }

    /* Main Status Card */
    .status-card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      margin-bottom: 24px;
    }

    .server-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }

    .pulse-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pulse-dot {
      width: 14px;
      height: 14px;
      background: var(--green);
      border-radius: 50%;
      position: relative;
      box-shadow: 0 0 16px var(--green);
    }

    .pulse-dot::after {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border-radius: 50%;
      border: 2px solid var(--green);
      opacity: 0.6;
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      100% { transform: scale(2.0); opacity: 0; }
    }

    .server-title {
      font-size: 18px;
      font-weight: 800;
    }

    .server-subtitle {
      font-size: 12px;
      color: var(--text-muted);
    }

    .btn-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 9px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--red), #dc2626);
      color: #fff;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.35);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 14px;
      margin-top: 24px;
    }

    .metric-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
    }

    .metric-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .metric-value {
      font-size: 16px;
      font-weight: 800;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-ok { background: rgba(34, 197, 94, 0.15); color: var(--green); border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-warn { background: rgba(234, 179, 8, 0.15); color: var(--yellow); border: 1px solid rgba(234, 179, 8, 0.3); }
    .badge-err { background: rgba(239, 68, 68, 0.15); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.3); }

    /* Endpoints Section */
    .section-title {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin: 28px 0 14px;
    }

    .endpoints-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .endpoint-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 13px;
    }

    .endpoint-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .method {
      font-size: 11px;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }
    .method-get { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .method-post { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .method-ws { background: rgba(168, 85, 247, 0.2); color: #c084fc; }

    .endpoint-path {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-weight: 700;
      color: #fff;
    }

    .endpoint-desc {
      color: var(--text-muted);
      font-size: 12px;
    }

    .footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: #52525b;
    }

    .footer a {
      color: var(--text-muted);
      text-decoration: none;
    }
    .footer a:hover { color: #fff; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="cards-deck-badge">
        <div class="mini-card card-r">U</div>
        <div class="mini-card card-y">N</div>
        <div class="mini-card card-g">O</div>
        <div class="mini-card card-b">!</div>
      </div>
      <h1 class="title">Uno Multiplayer <span class="accent">Backend</span></h1>
      <p class="subtitle">Realtime Game Server &amp; RESTful API Engine</p>
    </div>

    <!-- Status Card -->
    <div class="status-card">
      <div class="server-banner">
        <div class="pulse-wrapper">
          <div class="pulse-dot"></div>
          <div>
            <div class="server-title">Server is Live &amp; Listening</div>
            <div class="server-subtitle" id="live-time">Checking timestamp...</div>
          </div>
        </div>

        <div class="btn-group">
          <a href="${config.clientUrl}" class="btn btn-primary" target="_blank" rel="noreferrer">
            <span>Play Game</span> &rarr;
          </a>
          <a href="/api/db/init" class="btn btn-secondary" target="_blank" title="Verify or create tables and seed test accounts">
            <span>⚡ Init Database</span>
          </a>
          <a href="/health" class="btn btn-secondary" target="_blank">
            <span>View /health JSON</span>
          </a>
        </div>
      </div>

      <!-- Live Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">Port</div>
          <div class="metric-value">${config.port}</div>
        </div>

        <div class="metric-box">
          <div class="metric-label">Environment</div>
          <div class="metric-value" style="text-transform: capitalize;">${config.nodeEnv}</div>
        </div>

        <div class="metric-box">
          <div class="metric-label">PostgreSQL</div>
          <div class="metric-value">
            <span class="status-badge badge-warn" id="db-badge">Checking...</span>
          </div>
        </div>

        <div class="metric-box">
          <div class="metric-label">Game Store</div>
          <div class="metric-value">
            <span class="status-badge badge-ok" id="store-badge">In-Memory</span>
          </div>
        </div>

        <div class="metric-box">
          <div class="metric-label">Server Uptime</div>
          <div class="metric-value" id="uptime-val">—</div>
        </div>

        <div class="metric-box">
          <div class="metric-label">WebSockets</div>
          <div class="metric-value">
            <span class="status-badge badge-ok">Socket.IO</span>
          </div>
        </div>
      </div>

      <!-- API Endpoints -->
      <div class="section-title">Core Endpoints</div>
      <div class="endpoints-list">
        <div class="endpoint-item">
          <div class="endpoint-left">
            <span class="method method-get">GET</span>
            <span class="endpoint-path">/health</span>
          </div>
          <span class="endpoint-desc">System health, DB &amp; service diagnostics</span>
        </div>

        <div class="endpoint-item">
          <div class="endpoint-left">
            <span class="method method-get">GET</span>
            <span class="endpoint-path">/api/db/init</span>
          </div>
          <span class="endpoint-desc">Auto-create PostgreSQL tables &amp; seed test players</span>
        </div>

        <div class="endpoint-item">
          <div class="endpoint-left">
            <span class="method method-ws">WS</span>
            <span class="endpoint-path">/</span>
          </div>
          <span class="endpoint-desc">Socket.IO real-time multiplayer room &amp; card engine</span>
        </div>

        <div class="endpoint-item">
          <div class="endpoint-left">
            <span class="method method-post">POST</span>
            <span class="endpoint-path">/api/auth/register</span>
          </div>
          <span class="endpoint-desc">Player account creation</span>
        </div>

        <div class="endpoint-item">
          <div class="endpoint-left">
            <span class="method method-post">POST</span>
            <span class="endpoint-path">/api/auth/login</span>
          </div>
          <span class="endpoint-desc">JWT credentials authentication</span>
        </div>

        <div class="endpoint-item">
          <div class="endpoint-left">
            <span class="method method-get">GET</span>
            <span class="endpoint-path">/api/rooms</span>
          </div>
          <span class="endpoint-desc">List available public game rooms</span>
        </div>

        <div class="endpoint-item">
          <div class="endpoint-left">
            <span class="method method-get">GET</span>
            <span class="endpoint-path">/api/leaderboard</span>
          </div>
          <span class="endpoint-desc">Top player rankings and stats</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Uno Online Realtime Multiplayer Engine &bull; Client URL: <a href="${config.clientUrl}" target="_blank">${config.clientUrl}</a>
    </div>
  </div>

  <script>
    async function updateLiveHealth() {
      try {
        const res = await fetch('/health');
        if (res.ok) {
          const data = await res.json();
          document.getElementById('live-time').textContent = 'Server Time: ' + new Date(data.timestamp).toLocaleTimeString();
          
          const uptimeSec = data.uptime || 0;
          const mins = Math.floor(uptimeSec / 60);
          const hrs = Math.floor(mins / 60);
          document.getElementById('uptime-val').textContent = hrs > 0 ? (hrs + 'h ' + (mins % 60) + 'm') : (mins + 'm ' + (uptimeSec % 60) + 's');

          const dbBadge = document.getElementById('db-badge');
          if (data.services?.database === 'connected') {
            dbBadge.className = 'status-badge badge-ok';
            dbBadge.textContent = 'Connected';
          } else {
            dbBadge.className = 'status-badge badge-err';
            dbBadge.textContent = 'Disconnected';
          }

          const storeBadge = document.getElementById('store-badge');
          if (storeBadge) {
            storeBadge.className = 'status-badge badge-ok';
            storeBadge.textContent = (data.services?.store || 'In-Memory').toUpperCase();
          }
        }
      } catch (e) {
        document.getElementById('live-time').textContent = 'Live ping failed';
      }
    }

    updateLiveHealth();
    setInterval(updateLiveHealth, 5000);
  </script>
</body>
</html>`;
}

