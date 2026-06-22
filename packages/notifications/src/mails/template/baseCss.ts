// Light-only base stylesheet for the transactional mails. Injected as a single
// <style> child of <Head> because email clients ignore external CSS. The mails
// opt out of dark mode entirely (color-scheme: light + the matching <meta>),
// so no prefers-color-scheme block is shipped. mso-table-lspace/rspace live
// here, not inline: React drops camelCased mso-* keys from style props.
export const BASE_CSS = `
:root {
  color-scheme: light;
  supported-color-schemes: light;
}

body { width: 100%; background-color: #ffffff; margin: 0; padding: 0; -webkit-text-size-adjust: none; -webkit-font-smoothing: antialiased; -ms-text-size-adjust: none; mso-margin-top-alt: 0px; mso-margin-bottom-alt: 0px; mso-padding-alt: 0px 0px 0px 0px; }
html { width: 100%; }
a[href] { color: #000091; }
table { border-collapse: collapse; }
table, td { border-collapse: collapse; padding: 0px; margin: 0px; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
`;
