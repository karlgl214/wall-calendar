# Gilvarry Wall Calendar

A responsive, browser-based family dashboard inspired by a wall-mounted smart calendar. It combines a monthly, weekly, and daily calendar with shared tasks, a shopping list, family notes, a photo gallery, live weather for a saved custom location, a local Concord security-camera view, backup and restore, and large touch-friendly controls.

## Run locally

No build step is required. From the repository root, start any static server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Privacy and storage

Calendar data is stored in the current browser with `localStorage`. Photos are resized before being saved. There is no account or server-side database. Use **Settings → Export** to save a JSON backup and **Settings → Import** to restore one.

The weather widget uses Open-Meteo for global city/postcode search and current forecasts. Tap the location name in the header or use **Settings → Weather location** to choose a city. The selected location is stored only in the browser. The optional **Use my current location** action uses the browser's standard location permission.

## Concord CNK884P-A camera setup

The older Concord CNK884P-A is integrated through its HDMI output rather than recorder credentials or a public network stream. Connect the recorder’s HDMI output to an HDMI-to-USB capture dongle, then connect the dongle to the computer running the touchscreen. If the recorder’s only HDMI output is already connected to another display, use a powered HDMI splitter or move that display to another supported recorder output.

Open the published dashboard over HTTPS in a current version of Chrome or Edge, select **Cameras**, and tap **Start live view**. Allow camera access when the browser asks, then select the capture dongle from **Video source** if the default source is not correct. The browser remembers the selected device identifier for this dashboard. The captured picture mirrors the single-camera or multi-camera layout currently selected on the recorder.

The camera feed is never uploaded or recorded by the wall calendar. It goes directly from the USB capture device to the local browser, starts only after a user action, and stops when the user leaves the Camera screen or closes the page. Audio capture is deliberately disabled.

## Hosting

The project is compatible with GitHub Pages and other static hosts. Publish the repository root so `index.html` is the entry point.

## Credits

The header uses a Perth skyline photograph sourced from Unsplash image search. Interface icons are provided by [Lucide](https://lucide.dev/), and live weather data comes from [Open-Meteo](https://open-meteo.com/).

## Verification

The custom weather flow was browser-tested with a search for Sydney. The chosen coordinates, region, country, and time zone persisted correctly; current temperature, apparent temperature, humidity, wind, and the three-day forecast updated from the live API. The location trigger measures 100 × 44 pixels at the test viewport, and the page retained zero horizontal overflow.

Visual checks at **1920 × 1080** and **390 × 1000** confirmed that the expanded weather card fits the wall-display header and reorganizes into a full-width mobile card without covering the calendar or introducing horizontal overflow.

The location picker opens as a correctly labelled modal. Its close button is 44 × 44 pixels, search field and button are 46 pixels high, and the current-location action is 59 pixels high; no interactive control in the picker falls below the selected touchscreen target.

The geolocation path was also exercised with a controlled browser position. Coordinates and automatic time-zone selection persisted, the picker closed, and the widget refreshed its temperature and conditions successfully.

The Concord camera screen was browser-tested with a simulated USB HDMI capture stream. The live indicator, video state, device list, and saved source all updated correctly. Leaving the camera screen cleared the video element, ended the active media track, and returned the status to **Camera off**. The view retained zero horizontal overflow and all stop/fullscreen controls met the 44-pixel touch target.

Final hardware validation still requires connecting the physical HDMI-to-USB dongle and accepting the browser’s one-time camera permission on the touchscreen computer; that operating-system permission prompt is not available in the headless test environment.

The denied-permission path was simulated separately. It leaves the stream off, changes the status to **Connection problem**, explains how to allow site permission, and keeps **Start live view** enabled for a retry.

Visual checks at **1920 × 1080** and **390 × 1000** confirmed that the dedicated dark camera view, source selector, controls, privacy notice, and seven-button navigation fit without horizontal overflow. The idle-state review also caught and corrected the live-indicator visibility so **LIVE** now appears only while a stream is active.

The final `#cameras` deep link opens the Camera section directly with **Camera off**, no live badge, and the start/source controls available without first navigating through the calendar.
