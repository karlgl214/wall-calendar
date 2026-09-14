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

## Night dimming and screen lock

The bottom action bar includes **Dim Screen** for immediate low-light use. While dimmed, the display becomes a minimal dark clock; tapping anywhere wakes it. **Settings → Night dimming schedule** can enable automatic dimming, choose start and wake times, and select a 10%, 18%, 30%, or 40% screen level. The default preset is **9:30 pm to 6:30 am at 18%**, chosen for a 22-inch display in a dark room. The schedule runs in the open browser using the saved dashboard location’s time zone, so it needs no server or paid background service.

**Settings → Four-digit screen lock** sets or changes a numeric PIN. After a PIN is configured, **Lock Screen** is available in the bottom bar and Settings. An optional setting locks the page when the night schedule begins. The lock screen has a large touchscreen keypad, supports physical number keys and Backspace, and pauses attempts for 30 seconds after five incorrect PINs.

The PIN is never stored as plain text: the browser stores only a salted SHA-256 digest in this device’s local storage. The lock is intended to prevent casual access to the wall display; it is not a replacement for the computer’s operating-system login or full-disk security. There is deliberately no alternate sign-in or cloud recovery path, so the PIN should be kept somewhere safe.

Entering dim mode or locking the page stops an active Concord capture stream and exits camera fullscreen so the display cannot continue playing bright video behind the night or lock layer.

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

The night and lock controls were browser-tested end to end. Manual dim/wake switched cleanly, an all-day test schedule applied the selected 10% level, and tapping the dim screen created a temporary wake override. A test PIN was stored only as a salted digest, locked the page, and unlocked with the correct four digits. Five incorrect entries kept the page locked and triggered the 30-second pause. Keypad buttons measured 96 × 68 pixels in the test viewport, and the complete view had no horizontal overflow.

The locked state also survived a full page reload and restored the keypad before calendar access. The dim and lock clocks use the same configured location time zone as the main dashboard clock.

After reloading the timezone-aligned build, the expanded Settings page and nine-button bottom action bar remained fully visible at the browser test viewport with no horizontal overflow.

A fresh PIN-and-lock test confirmed that the main dashboard and lock page both displayed **10:09 pm** for the saved Perth time zone, after which the temporary test PIN was removed successfully.

Exact **1920 × 1080** renders confirmed that the expanded Settings page fits the 22-inch layout, the 18% dim state remains readable without glare, and the lock screen presents a centered, uncluttered keypad with large touch targets.

The clean-state reload used after security testing returned to **No PIN set** with both lock actions disabled, confirming that the temporary QA credential did not remain on the test device.

The optional **Lock when the night schedule begins** flow was tested separately: schedule entry simultaneously dimmed and locked the page, the first tap woke the display without bypassing the lock, and the correct PIN then unlocked it. A final control audit identified the original 30-pixel switch as too small for touch use, so all settings switches were enlarged to 60 × 44 pixels.

The closing browser audit found no enabled night or lock control below 44 pixels, no horizontal overflow, no active dim state, and no residual test PIN in local storage.

PIN management was also verified: an incorrect current PIN blocked a change, the correct current PIN allowed replacement, the replacement PIN unlocked the screen, and PIN removal disabled both lock actions without storing either test PIN. The final **1920 × 1080** Settings render shows the corrected switches and all controls without clipping.
