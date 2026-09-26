# Cleo AI Owner Control Centre

A responsive, static dashboard inspired by the supplied Cleo AI monitoring reference. It presents a polished **dark control-centre interface** for system health, users, uptime, hardware metrics, maintenance, and recent alerts.

## Features

- Responsive desktop, tablet, and mobile layouts
- Live local clock and contextual greeting
- Interactive control-centre navigation
- Simulated safe health check with visual status feedback
- Expandable recent-alert feed and user activity highlight
- No backend, accounts, tracking, analytics, or remote data collection
- Uses [Lucide](https://lucide.dev/) icons via CDN and Google Fonts

## Run locally

No build step is required. From the repository root:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173` in a browser.

## GitHub Pages

The project is a static site. In GitHub repository settings, set **Pages → Build and deployment → Deploy from a branch**, then select the `main` branch and the repository root (`/`).

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Dashboard structure and accessible labels |
| `styles.css` | Responsive visual design, components, and motion |
| `app.js` | Clock, navigation feedback, health-check simulation, and expandable feeds |

## Privacy

This demo uses no external app backend and stores no user information. The only third-party requests are for the public Google Fonts and Lucide icon CDN assets referenced by the page.
