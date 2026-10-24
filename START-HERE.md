# Slipframe 0.99

**Immersive browsing. Effortless switching.**

Slipframe brings your open tabs into a clear visual overview above the current page. An optional companion stylesheet lets Firefox’s tabs and address bar slide out of the way until you need them.

This release replaces the working name TabVista with Slipframe. It includes the glass S identity, a refined light/dark settings page, cool glass accents in the overview, a working hover/focus tab-close button, and a simplified download-only immersive setup. No donation button is included.

## Install or update for testing

1. Extract the entire ZIP to a permanent folder, for example Documents/Slipframe.
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Choose **Load Temporary Add-on…** and select `extension/manifest.json`.
4. If updating an existing temporary install, replace its extracted files and use **Reload** beside the extension, or remove that temporary install and load this manifest instead. Reload webpages where the old overview was injected.
5. On an ordinary website, press **Ctrl+Shift+Space**, use your configured gesture, or click Slipframe in the Extensions menu. Click the Slipframe name/logo in the overview to open settings.

The extension ID and preference storage keys are unchanged. Existing Gesturefy commands can keep their recipient and message. Firefox owns keyboard shortcut persistence; check your custom shortcut after reloading or reinstalling.

Temporary extensions disappear when Firefox fully restarts. Reload the manifest afterward. This package is unsigned: it has not been submitted, signed, published. No additional application is required. Do not disable Firefox signature verification.

## Everyday controls

- Click a preview, or focus it and press Enter/Space, to switch tabs.
- Middle-click a preview or click its hover × to close the tab. The close target also appears on keyboard focus and touch devices.
- Escape, the top-right ×, or empty overview space dismisses it.
- Arrow keys navigate previews. Tab/Shift+Tab navigate controls.
- The current window’s non-hidden tabs appear, including pinned tabs. Other windows and hidden tabs stay out of the overview.
- Closing the current/last tab follows Firefox’s normal behavior, including potentially closing the overview or window. Ctrl+Shift+T restores a closed tab.

## Make it yours

Settings include Fit all tabs or fixed preview size, maximum card width, spacing, page blur, page dimming, background preloading, and a hotkey recorder. Preferences save locally. Appearance defaults do not reset the separate hotkey. The settings page follows your light/dark system preference; screenshots in the overview remain sharp.

The default backdrop is deliberately light: 3px blur and 15% dimming. There is no search field or bottom command strip.

## Gesturefy

In Gesturefy → Preferences, create or edit a gesture. Choose **Send message to other add-on**:

- **Add-on ID:** `{d096dde4-cb0e-406f-8ce2-c84ac6a5bcb3}`
- **Message:** `{"action":"toggle"}`
- **Parse message:** **On**

Save in the command panel, then Save in Edit Gesture. Test on an ordinary website. Settings provide copy buttons for both fields. Only the official Gesturefy sender ID is accepted. Gesturefy’s own ID is not the recipient. This integration was confirmed working by the user before the branding update.

## Optional immersive mode

Open Slipframe settings → **Immersive mode** → **Download userChrome.css**. The download supplies the file; no code copying is needed for a fresh setup.

1. Open `about:support` in Firefox. Beside **Profile Folder**, choose **Open Folder**. A Copy about:support button supplies the address; paste it into the address bar to navigate.
2. Open the profile’s `chrome` folder, creating that folder only if it is missing.
3. Move the downloaded `userChrome.css` into it. Firefox does not supply this file by default; our download supplies it.
4. Enable `toolkit.legacyUserProfileCustomizations.stylesheets` in `about:config`.
5. Use horizontal tabs, turn off the separate Title Bar, and assign F2 to Toggle Bookmarks Toolbar in `about:keyboard` (Firefox 147+).
6. Fully restart Firefox and maximize normally. F2 switches modes; F11 is not needed.

If a stylesheet already exists, back it up before replacing it. Users with unrelated customizations should merge the downloaded code instead. Replace an older Slipframe immersive section rather than appending duplicate rules. Existing toolbar themes may conflict.

Setup requires a profile `chrome/userChrome.css`, `toolkit.legacyUserProfileCustomizations.stylesheets=true`, horizontal tabs, no separate title bar, and a full Firefox restart. Maximize normally; F11 is not required. Bind F2 to Toggle Bookmarks Toolbar using `about:keyboard` on Firefox 147+.

The mode uses native bookmarks visibility as its switch: Never Show enables immersive mode, Always Show restores normal chrome, and Only Show on New Tab preserves the native New Tab launch bookmarks. F2 changes this same preference; it cannot preserve an independent New Tab-only setting. Re-select that option after F2 if wanted.

The working native CSS behavior is unchanged from the latest confirmed bookmarks fix. The bundled version adds only section-boundary comments for installation/updating. The extension does not edit profile files or Firefox preferences. To undo, remove its marked section or restore your backup and restart.

## Previews and privacy

Previews are screenshots, not live video. Loaded website previews are prepared in the background and held only in a bounded memory cache (up to 120 images). Preloading pauses while the overview is open; navigation invalidates old captures. First installation/restart takes time to populate previews. Turn preloading off in settings if preferred.

Sleeping tabs stay asleep unless you explicitly choose **Load preview** on a card. That reloads the one tab in the background, waits for loading and attempts a screenshot; the tab remains loaded afterward. This consumes the page’s normal resources and may resume media. Some sites, protected pages, DRM content, and background rendering states cannot produce usable previews.

No analytics, screenshot uploads, remote fonts, or third-party code libraries are included. Preferences are local. Website favicons may load from their ordinary site URLs with no page referrer. See PRIVACY.md for the permissions and data handling.

## Compatibility and limits

Firefox 140+ supports the extension; the documented native F2 editor requires Firefox 147+. Immersive CSS has been tried by the user on maximized Windows Firefox with horizontal tabs. Other platforms, themes, and browser updates need checking.

Firefox prevents the in-page overview from opening on internal settings pages, other extensions, Mozilla Add-ons, and some protected domains. Use an ordinary website. A notification explains unavailable pages. Gesturefy has its own protected-page restrictions.

Tab removal updates the open grid. New tabs, renamed tabs, or reordered tabs require reopening the overview. The extension does not reorder tabs. Native fullscreen, page fullscreen and unusual website keyboard handling need separate compatibility testing. A closed shadow root isolates styles, not security against hostile pages.

## Validation and release

Existing automated background, layout and settings tests pass after rebranding. They cover capture ordering, overview toggling, sender/window authorization, close and wake operations, preload behavior, settings validation, hotkey conversion and grid sizing. JavaScript syntax, package resources, unchanged permissions/UUID, and unchanged native CSS rules are checked.

The branding and revised settings page have not been rendered or tested in actual Firefox in this environment. Before signing, check the icon at toolbar size, settings in light/dark modes, setup-address copying, narrow windows, hover ×, keyboard focus, hotkey, Gesturefy, and your existing immersive mode. Prior user confirmation covers the earlier working functionality, not this new visual build.

`release/Slipframe-v0.99-unsigned.zip` is the extension-only package, with `manifest.json` at its root, for Mozilla submission after testing. The outer ZIP includes source, tests, branding and documentation. Signing/publication is still a separate step.

## Development

Run with Node.js (development only; users do not need Node):

```
node tests/background.test.cjs
node tests/layout.test.cjs
node tests/settings.test.cjs
```

`branding/slipframe-glass-master.png` is the selected glass icon artwork. Optimized PNG sizes are in `extension/icons/`; `extension/icon.svg` is the simplified high-contrast 16px companion. All assets ship locally. The extension’s fixed anonymous UUID remains stable across the rename.

## 0.99 setup polish

Removed Copy immersive CSS and its stylesheet-fetch code. The download supplies the correctly named file. Instructions now focus on locating the profile, moving the file, enabling CSS, setting the shortcut and restarting. Copy about:support supplies an address, not automatic navigation or folder access. No permissions or immersive CSS rules changed.

## 0.99 visual release candidate

The larger Slipframe logo/name now sits at bottom left and still opens settings. Each card has a compact favicon/title row immediately above its preview, with a transparent hover/focus close target at the right. Website addresses and their settings toggle are removed. A faint ice-blue/lilac gradient glass rim stays confined to the preview border. The preview image itself is not tinted or blurred. Grid sizing reserves a 32px title row and space for the bottom branding.

Automated layout/settings/background checks pass. This new presentation still requires a Firefox visual smoke test. No donation control or new permissions are included.
