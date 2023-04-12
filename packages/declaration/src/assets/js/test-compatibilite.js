// The declaration app is not compatible with Internet Explorer.
// See https://fr.w3docs.com/snippets/javascript/comment-detecter-internet-explorer-en-javascript.html.


const ua = window.navigator.userAgent;
const msie = ua.indexOf('MSIE '); // to detect IE 10 and older
const trident = ua.indexOf('Trident/'); // to detect IE 11

if (msie > 0 || trident > 0) {
    if (!window.location.href.endsWith('/compatibilite.html')) {
        console.warn("Navigateur non compatible", { msie, trident })
        window.location.href = '{{site.baseurl}}/compatibilite.html'
    }
}
