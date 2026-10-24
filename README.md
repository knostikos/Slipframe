<p align="center"><img src="extension/icons/icon-128.png" width="96" alt="Slipframe glass S logo"></p>
<h1 align="center">Slipframe</h1>
<p align="center">Immersive browsing. Effortless switching.</p>

**Version 0.99 · Firefox · Unsigned release candidate**

A visual tab switcher that floats above your current page, paired with optional auto-hiding browser controls. See your open pages, switch without hunting through tiny tabs, and give the web more room.

- Clear screenshot previews with favicons and compact titles above each frame.
- Automatic grid sizing, subtle glass borders, and a lightly blurred backdrop.
- Click to switch; middle-click or hover × to close.
- Keyboard shortcut and optional Gesturefy integration.
- Appearance controls, light/dark settings, and background preview caching.
- Optional immersive CSS: browser controls slide away and reveal at the top edge.
- Local screenshot processing. No analytics, accounts, or developer-operated service.

## Feature demos

### Optional immersive mode

https://github.com/user-attachments/assets/e209c64b-35ff-4bca-9272-c886fa598f55

### Slipframe tab overview

[Watch the Slipframe tab overview demo](demo/slipframe-overview.mp4)

The full-resolution clips are available in [demo/](demo/).

## Try it

Download/extract this project, open about:debugging#/runtime/this-firefox in Firefox, choose **Load Temporary Add-on…**, and select extension/manifest.json. On an ordinary website, press **Ctrl+Shift+Space**. Click the Slipframe logo at bottom left of the overview to open settings.

Temporary installs disappear after restarting Firefox. Permanent installation needs Mozilla signing; this build has not been submitted or signed. The extension requires Firefox 140+. The documented optional F2 setup requires Firefox 147+.

See [START-HERE.md](START-HERE.md) for installation, updating, Gesturefy, immersive setup, limitations and rollback. See [PRIVACY.md](PRIVACY.md) for data handling and permissions.

## Optional immersive mode

In settings, download userChrome.css, open about:support → Profile Folder → Open Folder, and move the file into the profile’s chrome folder (create the folder if missing). Follow the remaining setup steps in settings to enable custom CSS, configure F2 and restart. Existing stylesheets should be backed up or merged.

The extension and native UI stylesheet are separate: installing the add-on does not automatically edit profile files. The stylesheet has been tried on maximized Windows Firefox with horizontal tabs; other configurations and browser updates need testing.

## Development

No bundled libraries, remote fonts, or build framework. Source files are in extension/.

~~~text
node tests/background.test.cjs
node tests/layout.test.cjs
node tests/settings.test.cjs
python3 build.py
~~~

Python packaging uses only the standard library. Users need neither Node nor Python to run the add-on. The resulting release/Slipframe-v0.99-unsigned.zip has manifest.json at its root for submission to Mozilla after testing.

The automated tests cover background authorization and capture behavior, preference/hotkey validation, and grid sizing. Version 0.99's visual changes still need a Firefox smoke test; passing mocks does not verify browser rendering or installation.

## License

[MIT](LICENSE.txt).
