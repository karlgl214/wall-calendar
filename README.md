# Cleo AI Owner Control Centre

A responsive, static **Linux-laptop-friendly** dashboard for Cleo AI. It is designed to look and behave like dedicated control software while being honest about its current data source.

## Current mode: Demo

The dashboard starts in a visible **DEMO** mode. Every hardware, uptime, security, and AI-workload value is sample telemetry until a real Cleo Server is configured. It will never label itself **LIVE** until the server health endpoint responds successfully.

The top status chip always includes telemetry freshness, for example: **“Sample telemetry updated 4 seconds ago”**. In live mode it becomes **“Telemetry updated 4 seconds ago.”**

## Included controls

- Demo/LIVE/OFFLINE indicator with telemetry freshness
- Cleo Server card: connection state, Linux uptime, network/IP state, and dashboard link status
- GPU detail: VRAM, power draw, fan RPM, and AI workload
- Storage detail: individual sample drives, capacity, temperature, SMART health, and wear recommendation
- Cleo AI workload: model state, active requests, active users, and p95 response time
- Security panel: firewall state, failed sign-ins, blocked connections, and last scan
- Maintenance history: record a replacement/service date and notes locally
- Alert acknowledgement: acknowledged alerts persist locally and are added to maintenance history
- Fullscreen control for an ASUS/Linux laptop so browser chrome can be removed
- Responsive desktop, tablet, and mobile layouts

## Run locally

No build step is required:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173` in Chromium, Chrome, or Firefox.

## Connecting a Cleo Server

Before loading `app.js`, set a server base URL in `index.html`:

```html
<script>
  window.CLEO_SERVER_URL = "https://cleo-server.example.local";
</script>
<script src="app.js"></script>
```

The dashboard performs a read-only `GET /health` request every 15 seconds. The server must allow the dashboard origin with CORS and respond with JSON. The smallest supported payload is:

```json
{
  "status": "online"
}
```

For richer live telemetry, return fields in this shape:

```json
{
  "status": "online",
  "name": "Cleo Server",
  "system": {
    "uptime": "26 days 04 hours",
    "since": "2026-09-01 11:34"
  },
  "network": {
    "ip": "192.168.1.81",
    "state": "LAN"
  },
  "ai": {
    "model": "Cleo Core v1.0",
    "requests_running": 1,
    "active_users": 2,
    "response_p95_ms": 42
  }
}
```

If the endpoint cannot be reached, the dashboard switches to **OFFLINE** and retains its last demo/sample presentation rather than claiming the server is available.

> The current static dashboard does not collect credentials, send commands to the server, or expose SSH/system controls. The live endpoint is deliberately read-only.

## Privacy and local data

Maintenance records and alert acknowledgements are stored only in the browser’s local storage on the laptop. Clear the site’s local browser data to remove them.

## GitHub Pages

The repository root is ready for GitHub Pages. Set **Pages → Build and deployment → Deploy from a branch**, choose `main`, and select `/` as the source folder.
