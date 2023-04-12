/** @type {import("zustand/vanilla")} */
const zustandVanilla = window.zustandVanilla;
/** @type {import("zustand/middleware")} */
const zustandMiddleware = window.zustandMiddleware;
/** @type {import("zustand/middleware/immer")} */
const zustandMiddlewareImmer = window.zustandMiddlewareImmer;

const { createStore } = zustandVanilla;
const { persist, combine } = zustandMiddleware;
const { immer } = zustandMiddlewareImmer;

const gdprStore = createStore(
    persist(
        immer(
            combine({
                consentModalButtonProps: {},
                /** @type {Record<string, boolean>} */
                consents: {},
                firstChoiceMade: false,
                modalButtonProps: { "aria-controls": "fr-consent-modal", "data-fr-opened": "false" }
            }, _set => {})
        ),
        {
            name: "gdpr-consent"
        }
    )
)

const {consents} = gdprStore.getState();


var _paq = window._paq = window._paq || [];
if (consents.matomo) {
    console.info("Tracking matomo activé");
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    _paq.push(['setTrackerUrl', 'https://matomo.fabrique.social.gouv.fr/matomo.php']);
    _paq.push(['setSiteId', '11']);
}
