# Slipframe privacy

Slipframe has no developer-operated server, analytics, telemetry, advertising or screenshot uploads. It reads current-window tab metadata and captures loaded website previews to provide the local tab overview. Screenshots and tab metadata are held in memory, with a bounded image cache, and are discarded when the extension/browser shuts down or the tab is closed. Appearance/preloading preferences are stored in Firefox extension-local storage; keyboard shortcuts are stored by Firefox. Screenshots are not persisted to disk by the extension.

Website favicons are loaded from the favicon URL Firefox supplies and may cause an ordinary request to that website. The extension sets no-referrer for these images. A user clicking Get Gesturefy opens its public Mozilla Add-ons listing. No browsing data is sent to a Slipframe service because no such service is used.

Background screenshot preloading can be disabled in settings. Discarded tabs are not automatically awakened. Clicking Load preview explicitly reloads that one sleeping website tab to capture it; it remains loaded afterward. Private-window access is controlled by Firefox's own explicit extension permission. The optional immersive CSS is a separately downloaded file that the user installs manually; the extension cannot modify the Firefox profile automatically.

Permissions: tabs for listing/switching/closing tabs and their metadata; all websites for screenshot capture and the overlay; notifications for unavailable-page feedback; storage for local preferences. Gesturefy external messages are accepted only from its known official extension ID and only for the toggle action.
