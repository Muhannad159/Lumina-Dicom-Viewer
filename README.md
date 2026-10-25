# Lumina

Lumina is a local DICOM workspace. Its logo and wordmark adapt to all four themes; `public/lumina.svg` is the standalone app icon.

Additional tools are available under **More tools**: **Pixel probe (I)**, **Magnifier (M)** (hold and drag for a 2× lens), **Arrow annotation (A)** (draw, then enter a label), and **Bidirectional measurement (B)**. Selecting a drawing tool stops cine playback. The **Measurements** panel follows the active viewport's series and lists its measurements across slices, with jump-to-image, rename, show/hide, and delete actions. Values use Cornerstone's image calibration and reported units. Labels and measurements remain in memory and are removed by Clear Session.

Annotation dialogs live in `src/features/viewer/annotations/`; measurement data, subscriptions, and presentation live in `src/features/viewer/measurements/`. The theme-aware logo lives in `src/components/LuminaLogo.tsx`.

The full tool set also includes:

- **Cobb angle:** draw the first line, then the second line.
- **Freehand ROI:** hold and trace a region, returning to the starting point to close it.
- **Spline ROI:** place control points, then click the first point or double-click to finish.
- **Regional window / level:** drag a rectangle over the region whose contrast you want to use.
- **Sync Views:** independently link window/level, zoom/pan, and spatial slices to the active viewport. The control requires two loaded images, and incompatible options are dimmed. Spatial matching uses valid single-frame images with compatible orientations and a matching Frame of Reference UID, including across studies for the same patient. Images missing geometry are skipped rather than disabling a whole target series. Matching uses plane positions, never slice numbers. Window/level links only apply to matching modalities.
- **Reference lines:** show where the active image plane intersects another compatible image. A matching Frame of Reference is required, and conflicting patient IDs are rejected; matching Study UID is not required. Parallel planes have no intersection line. These are stack comparison aids; separate image registration is not included.
- **MPR:** Open MPR from the toolbar for an eligible local series. Lumina streams one Cornerstone volume into axial, sagittal, and coronal panes, showing loading progress while slices arrive. Crosshairs are selected initially: click, tap, or drag to locate the same position in all three planes. Focus a crosshair and use arrow keys (Shift for larger steps) for keyboard navigation. Color-coded reference lines follow wheel/slider scrolling, pan, zoom, and resizing. Expand any pane without rebuilding the volume. The toolbar also provides pan, zoom, window/level, reset, and exit.
- **Key-image bookmarks:** bookmark the current image from More tools, then use Key-image bookmarks to reopen an exact series/frame. Bookmarks survive home/viewer navigation, deduplicate repeated saves, and clear with the session.
- **CSV / JSON export:** download the active series' measurements and labels from the Measurements panel, with Study/Series/SOP identifiers and frame numbers. JSON also includes numeric cached measurements and units. CSV labels are escaped to avoid spreadsheet formula interpretation. These exports are summaries, not DICOM SR files or a persistent session format.

Comparison geometry and synchronization live in `src/features/viewer/comparison/`; MPR eligibility, volume loading, and panes live in `src/features/viewer/mpr/`; bookmarks live in `src/features/viewer/bookmarks/`. Session state owns bookmarks while rendering and tool state remain in the viewer feature. Frame lists are cached per immutable series, and comparison updates are coalesced per animation frame.

A standalone, browser-based DICOM workspace adapted from `D:\RAMYRO-FRONTEND\pocViewer`. The source project is unchanged. This copy retains React, TypeScript, Vite, Tailwind 4, and Cornerstone 4.15.25, with a new interface and a local file pipeline.

## Run locally

Use Node.js 20.19+ or a supported newer LTS release.

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). Open File accepts multiple files. Open Folder scans nested folders. Files and folders can also be dropped anywhere on the application. Extensionless DICOM files are supported; filename extensions do not determine study identity.

Imports are transactional: cancelled imports do not modify the existing session. Additional imports merge with open studies and skip repeated SOP Instance UIDs. Import details explain files that were skipped. There is no authentication, DICOMweb endpoint, account, upload, analytics, or backend configuration.

## Using the workspace

- Studies group by Study Instance UID; series group by Series Instance UID. Instances sort geometrically when their image positions and orientations are compatible, otherwise by instance number and SOP Instance UID. Multiframe instances preserve frame order.
- Click a viewport, then a series thumbnail to assign it. On desktop, drag a thumbnail onto a viewport. Each viewport keeps its own tools, camera, slice, and window settings. Measurements belong to their series, including when that series appears in multiple viewports.
- Layouts are **rows × columns**: 1×1, 1×2, 2×1, 2×2. Choosing a layout puts the active series first and fills remaining cells from the same study. Extra cells stay empty. Assign series from other studies manually to compare them.
- Study sections collapse independently. On mobile and portrait displays, the study browser moves below the image area. Expand a study to reveal its thumbnails to the right, then scroll along the same row to reach the next study. The entire browser can also be collapsed.
- Choose Dark, Light, Blue, or Green in the header. Theme colors live in CSS variables at the top of `src/styles.css`, exposed to Tailwind through `@theme inline`. Image backgrounds remain black.
- The toolbar is centered when it fits and stays in one horizontally scrolling row on smaller screens. More tools opens in a floating panel outside the scroll container, including in fullscreen.
- Each viewport has a vertical slice slider on its right edge: first image at the top, last at the bottom. Drag or click the track, use Up/Down, Home/End, or Page Up/Page Down. Its value also follows wheel scrolling and cine playback.
- Clear Session releases images, measurements, thumbnails, file registrations, MPR volumes, and rendering caches. In-progress decoding finishes before numeric file IDs are reused. Returning home keeps the imported catalog; refreshing or closing the tab discards it. Only the theme is saved in local storage.

### Controls

| Action                      | Control                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Scroll images               | Mouse wheel, slice slider, or Scroll tool (`S`)                                          |
| Window / level              | Window tool (`W`), primary drag                                                          |
| Pan                         | Pan tool (`P`) or middle-button drag                                                     |
| Zoom                        | Zoom tool (`Z`) or right-button drag                                                     |
| Touch                       | One-finger drag uses the selected tool; two fingers pan; select Zoom for one-finger zoom |
| Measure                     | Length (`L`), rectangle ROI, elliptical ROI, angle                                       |
| Reset presentation          | Reset view (`R`); measurements remain                                                    |
| Delete selected measurement | More menu, Delete, or Backspace                                                          |
| Clear series measurements   | More menu; affects only the active series                                                |
| Cine                        | Play/Pause or Space; choose 5–30 fps                                                     |
| Rotate / flip / invert      | More menu                                                                                |
| Window presets              | More menu: DICOM default, CT soft tissue/lung/bone/brain                                 |
| Image information           | More → Image metadata; current-frame file information and common DICOM tags              |
| Screenshot                  | Camera → optional Crop → drag a rectangle → Download PNG                                 |
| Fullscreen                  | More menu; availability depends on the browser                                           |

Screenshots include the image, visible measurements, and patient/study labels. Crop excludes everything outside the selected rectangle. Downloads are local PNG files; they are not DICOM exports. Keyboard shortcuts are inactive while a dialog or form control has focus.

## Supported imports and practical limits

The app accepts DICOM Part 10 image files using the transfer syntaxes handled by the pinned Cornerstone loader: uncompressed implicit/explicit VR little endian, explicit VR big endian, deflated explicit VR, RLE, JPEG baseline/extended/lossless, JPEG-LS, JPEG 2000, and HTJ2K. A supported transfer syntax does not guarantee every vendor object can be displayed; per-image decoding errors appear in the affected viewport.

Single-frame and supported multiframe stack images are included. Enhanced objects depend on Cornerstone's per-frame metadata support. DICOMDIR is treated as an index: choose its containing folder to import the actual image files. Reports, presentation states, segmentation, radiotherapy objects, unsupported transfer syntaxes, and files missing valid Study/Series/SOP identifiers are reported rather than silently combined. Raw datasets without a usable Part 10 header are not inferred. ZIP extraction, 3D rendering, volume synchronization, and persistent study storage are not included.

MPR is enabled only for a regular, spatially reconstructable **single-frame grayscale series** with at least two slices, consistent Frame of Reference, dimensions, orientation, pixel spacing, and distinct positions. It checks slice spacing, in-plane drift, supported pixel format, and the browser's WebGL2 3D texture size before loading the volume. There is no fixed application memory cap; very large series may exhaust browser memory or cause the tab to close. The disabled button explains the first failing requirement. Multiframe cine and enhanced multiframe objects remain viewable as stacks; MPR is disabled until their per-frame geometry can be validated. Missing slices or irregular spacing are disabled rather than displayed at invented positions. The source files remain in the browser throughout.

The application keeps file handles and lightweight metadata in memory. Metadata is parsed in up to three workers using an initial 64 KiB header read, growing as needed for long headers or deflated datasets. Large pixel payloads normally do not need to be read in full during indexing. Imports still finish indexing before committing the new session. Thumbnails are generated serially on demand. Decoded stack image caching starts at 384 MiB; MPR temporarily adds estimated resident volume capacity (four bytes per voxel), then restores the cache limit on exit. This is a cache capacity reservation, not a memory allocation or an MPR eligibility cap. MPR uses indexed geometry as a fallback metadata provider and lets Cornerstone stream decoded slices instead of predecoding the whole stack. Full image reads and decoding still require browser memory, especially for large multiframe files. Decode errors interrupt MPR with an explicit message; exiting cancels queued volume work and releases its metadata provider and cache reservation.

Folder picking and folder dropping depend on browser APIs. The app uses a directory input plus recursive File and Directory Entries traversal, draining every directory batch. If the folder picker is unavailable, it falls back to multiple-file selection. Mobile operating systems may expose files without exposing folders. Use a current browser with WebGL and Web Workers enabled.

## Production / future static hosting

```powershell
npm run build
npm run preview
```

Deploy the contents of `dist/` to any static HTTP(S) host. The clean viewer route (`/viewer`) must fall back to `index.html`; `vercel.json` configures this for Vercel. The default relative asset base supports a subdirectory. To set a fixed base explicitly:

```powershell
$env:VITE_BASE_PATH = '/dicom/'
npm run build
Remove-Item Env:VITE_BASE_PATH
```

Keep the entire generated `assets/` directory, including `.wasm` decoder modules and worker scripts. Serve JavaScript and WASM using their normal MIME types (`application/javascript` and `application/wasm`). Fonts and codecs are bundled; no CDN is needed. Use an HTTP server rather than opening `index.html` with `file://`. The home page loads separately from the heavier imaging modules, which are fetched when needed.

No deployment or service worker is configured. Images stay local, but loading/reloading the application requires access to its static assets; this is not an installed offline PWA.

## Project structure

```text
src/
  App.tsx                    Provider composition only
  components/                App shell/header and reusable Button, IconButton, Modal, Popover, Select
  hooks/                     Path navigation and notifications
  features/home/             Home page, hero, drop zone, feature cards
  features/import/           Import transactions, file selection/drop handling, progress and reports
  features/session/          Typed session context, catalog ownership and resource cleanup
  features/theme/            Typed theme context, persistence and picker
  features/dicom/             Types, parser worker, recursive import, catalog and layouts
  features/viewer/            Viewport/grid/overlay components, study browser, capture and commands
    hooks/                   Engine/viewport lifecycle, assignments, registry, cine, actions, shortcuts
    toolbar/                 Imaging tools, layout/playback controls and More tools
  lib/                       Small shared class composition helper
  styles.css                 Tailwind entry, semantic theme tokens, base/native-browser defaults
tests/
  fixtures.mjs                Synthetic DICOM generator (no real patient data)
  dicom.test.mjs              Import, grouping, sorting, cancellation, layout tests
  browser/                   Production-browser integration and visual checks
```

## Verification

```powershell
npm run lint
npm run format:check
npm test
npm run build
npm run test:browser
```

Browser tests use installed Google Chrome in headless mode and start Vite's production preview. Set `PLAYWRIGHT_CHANNEL=msedge` to use installed Edge instead. For environments without either browser, install Playwright Chromium and change the channel configuration to suit that environment. Screenshots and traces are generated under the ignored `test-results/` directory.

Component presentation uses Tailwind utilities and typed shared-control variants. The `compact:` variant applies on narrow or portrait screens; `fullscreen:` targets the fullscreen viewer. Inline styles are reserved for calculated crop and popup coordinates. Browser tests use accessible names and explicit test identifiers, so changing utility classes does not invalidate behavioral tests.

Synthetic fixtures exercise uncompressed images, RLE compression, multiframe playback, long headers, and cancellation/reopening of a 64-slice MPR stack. Public pydicom JPEG-LS and JPEG 2000 fixtures exercise the actual local decoder paths; their provenance and license are in `tests/fixtures/pydicom/`. Browser checks cover rendered pixels in all MPR panes, linked mouse/keyboard/touch crosshairs, pane expansion, thumbnails, measurements, screenshot download, layouts, themes, responsive presentation, session reset, and absence of external image-data requests. A plain static-server smoke test checks workers and codecs under `/lumina/`. HTJ2K, vendor-specific enhanced objects, and larger clinical datasets still need representative validation. Physical iOS/Android device testing remains a separate check from desktop-browser mobile emulation.

The loader's WASM wrappers can emit Vite warnings about browser-externalized Node `fs`/`path` branches. The browser integration tests verify the actual browser execution path. Cornerstone's imaging bundle also exceeds Vite's default 500 kB chunk-size advisory.
