# Gilvarry Wall Calendar

A responsive, browser-based family dashboard inspired by a wall-mounted smart calendar. It combines a monthly, weekly, and daily calendar with shared tasks, a shopping list, family notes, a photo gallery, live weather for a saved custom location, local backup and restore, and large touch-friendly controls.

## Run locally

No build step is required. From the repository root, start any static server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Privacy and storage

Calendar data is stored in the current browser with `localStorage`. Photos are resized before being saved. There is no account or server-side database. Use **Settings → Export** to save a JSON backup and **Settings → Import** to restore one.

The weather widget uses Open-Meteo for global city/postcode search and current forecasts. Tap the location name in the header or use **Settings → Weather location** to choose a city. The selected location is stored only in the browser. The optional **Use my current location** action uses the browser's standard location permission.

## Hosting

The project is compatible with GitHub Pages and other static hosts. Publish the repository root so `index.html` is the entry point.

## Credits

The header uses a Perth skyline photograph sourced from Unsplash image search. Interface icons are provided by [Lucide](https://lucide.dev/), and live weather data comes from [Open-Meteo](https://open-meteo.com/).

## Verification

The custom weather flow was browser-tested with a search for Sydney. The chosen coordinates, region, country, and time zone persisted correctly; current temperature, apparent temperature, humidity, wind, and the three-day forecast updated from the live API. The location trigger measures 100 × 44 pixels at the test viewport, and the page retained zero horizontal overflow.

Visual checks at **1920 × 1080** and **390 × 1000** confirmed that the expanded weather card fits the wall-display header and reorganizes into a full-width mobile card without covering the calendar or introducing horizontal overflow.

The location picker opens as a correctly labelled modal. Its close button is 44 × 44 pixels, search field and button are 46 pixels high, and the current-location action is 59 pixels high; no interactive control in the picker falls below the selected touchscreen target.

The geolocation path was also exercised with a controlled browser position. Coordinates and automatic time-zone selection persisted, the picker closed, and the widget refreshed its temperature and conditions successfully.
