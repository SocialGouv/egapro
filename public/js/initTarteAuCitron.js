/* globals tarteaucitron, gtag */

tarteaucitron.init({
  privacyUrl: "/politique-confidentialite#cookies" /* Privacy policy url */,

  hashtag: "#tarteaucitron" /* Open the panel with this hashtag */,
  cookieName: "tarteaucitron" /* Cookie name */,

  orientation: "bottom" /* Banner position (top - bottom) */,

  groupServices: false /* Group services by category */,

  showAlertSmall: false /* Show the small banner on bottom right */,
  cookieslist: false /* Show the cookie list */,

  closePopup: false /* Show a close X on the banner */,

  showIcon: true /* Show cookie icon to manage cookies */,
  //"iconSrc": "", /* Optionnal: URL or base64 encoded image */
  iconPosition: "BottomRight" /* BottomRight, BottomLeft, TopRight and TopLeft */,

  adblocker: false /* Show a Warning if an adblocker is detected */,

  DenyAllCta: true /* Show the deny all button */,
  AcceptAllCta: true /* Show the accept all button when highPrivacy on */,
  highPrivacy: true /* HIGHLY RECOMMANDED Disable auto consent */,

  handleBrowserDNTRequest: false /* If Do Not Track == 1, disallow all */,

  removeCredit: true /* Remove credit link */,
  moreInfoLink: false /* Show more info link */,

  useExternalCss: false /* If false, the tarteaucitron.css file will be loaded */,
  useExternalJs: false /* If false, the tarteaucitron.js file will be loaded */,

  //"cookieDomain": ".my-multisite-domaine.fr", /* Shared cookie for multisite */

  readmoreLink: "/politique-confidentialite#cookies" /* Change the default readmore link */,

  mandatory: true /* Show a message about mandatory cookies */,
})

tarteaucitron.user.gtagUa = "DC-3048978"
// tarteaucitron.user.gtagCrossdomain = ['example.com', 'example2.com'];
tarteaucitron.user.gtagMore = function () {
  /* add here your optionnal gtag() */
  gtag("event", "conversion", {
    allow_custom_scripts: true,
    send_to: "DC-3048978/emplo253/lpegapro+unique",
  })
}
;(tarteaucitron.job = tarteaucitron.job || []).push("gtag")
