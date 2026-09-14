# Gilvarry Wall Calendar

A responsive, browser-based family dashboard inspired by a wall-mounted smart calendar. It combines a monthly, weekly, and daily calendar with shared tasks, a shopping list, family notes, a photo gallery, live Perth weather, local backup and restore, and large touch-friendly controls.

## Run locally

No build step is required. From the repository root, start any static server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Privacy and storage

Calendar data is stored in the current browser with `localStorage`. Photos are resized before being saved. There is no account or server-side database. Use **Settings → Export** to save a JSON backup and **Settings → Import** to restore one.

## Hosting

The project is compatible with GitHub Pages and other static hosts. Publish the repository root so `index.html` is the entry point.

## Credits

The header uses a Perth skyline photograph sourced from Unsplash image search. Interface icons are provided by [Lucide](https://lucide.dev/), and live weather data comes from [Open-Meteo](https://open-meteo.com/).
