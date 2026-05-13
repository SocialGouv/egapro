import { COLORS, FONT_SIZE, FONT_STACK, SPACING } from "./dsfr-tokens.js";
import { escapeHtml, getPublicUrl } from "./helpers.js";
const HEADER_HTML = `
<tr>
  <td style="background:${COLORS.blueFrance}; padding:${SPACING.w2} ${SPACING.w3};">
    <div style="color:${COLORS.white}; font-family:${FONT_STACK}; font-size:${FONT_SIZE.sm}; font-weight:700; letter-spacing:0.04em; text-transform:uppercase;">République Française</div>
    <div style="color:${COLORS.white}; font-family:${FONT_STACK}; font-size:${FONT_SIZE.xs}; font-style:italic; margin-top:4px;">Liberté · Égalité · Fraternité</div>
  </td>
</tr>
<tr>
  <td style="background:${COLORS.backgroundDefault}; padding:${SPACING.w3}; border-bottom:1px solid ${COLORS.border};">
    <div style="font-family:${FONT_STACK}; font-size:${FONT_SIZE.lg}; font-weight:700; color:${COLORS.blueFrance}; line-height:1.2;">Égalité Professionnelle</div>
    <div style="font-family:${FONT_STACK}; font-size:${FONT_SIZE.sm}; color:${COLORS.textMention}; margin-top:4px;">Plateforme Egapro</div>
  </td>
</tr>
`;
function footerHtml() {
    const publicUrl = getPublicUrl();
    return `
<tr>
  <td style="background:${COLORS.backgroundAlt}; padding:${SPACING.w3}; border-top:1px solid ${COLORS.border}; font-family:${FONT_STACK}; font-size:${FONT_SIZE.xs}; color:${COLORS.textMention}; line-height:1.5;">
    <p style="margin:0;">Cet e-mail a été envoyé automatiquement par la plateforme Egapro. Merci de ne pas y répondre.</p>
    <p style="margin:${SPACING.w1} 0 0;">
      <a href="${escapeHtml(publicUrl)}" style="color:${COLORS.blueFrance}; text-decoration:underline;">${escapeHtml(publicUrl)}</a>
    </p>
  </td>
</tr>`;
}
export function wrapEmail({ title, intro, body }) {
    const introBlock = intro
        ? `<p style="margin:0 0 ${SPACING.w3}; font-family:${FONT_STACK}; font-size:${FONT_SIZE.md}; color:${COLORS.textDefault}; line-height:1.5;">${escapeHtml(intro)}</p>`
        : "";
    return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background:${COLORS.backgroundAlt}; font-family:${FONT_STACK}; color:${COLORS.textTitle};">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${COLORS.backgroundAlt};">
<tr>
<td align="center" style="padding:${SPACING.w3} ${SPACING.w2};">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px; background:${COLORS.backgroundDefault}; border:1px solid ${COLORS.border};">
${HEADER_HTML}
<tr>
<td style="padding:${SPACING.w4} ${SPACING.w3}; font-family:${FONT_STACK}; font-size:${FONT_SIZE.md}; color:${COLORS.textTitle}; line-height:1.5;">
<h1 style="margin:0 0 ${SPACING.w2}; font-size:${FONT_SIZE.xl}; color:${COLORS.textTitle};">${escapeHtml(title)}</h1>
${introBlock}
${body}
</td>
</tr>
${footerHtml()}
</table>
</td>
</tr>
</table>
</body>
</html>`;
}
export function infoList(rows) {
    const cells = rows
        .map(({ label, value }) => `
<tr>
<td style="padding:${SPACING.w1} ${SPACING.w2} ${SPACING.w1} 0; color:${COLORS.textMention}; font-size:${FONT_SIZE.sm}; vertical-align:top; width:200px;">${escapeHtml(label)}</td>
<td style="padding:${SPACING.w1} 0; color:${COLORS.textTitle}; font-size:${FONT_SIZE.sm}; font-weight:600;">${escapeHtml(String(value))}</td>
</tr>`)
        .join("");
    return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 ${SPACING.w3}; background:${COLORS.backgroundAlt}; padding:${SPACING.w2};"><tbody>${cells}</tbody></table>`;
}
export function ctaButton({ label, href }) {
    const safeHref = escapeHtml(href);
    const safeLabel = escapeHtml(label);
    return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:${SPACING.w2} 0 ${SPACING.w3};">
<tr>
<td style="background:${COLORS.blueFrance};">
<a href="${safeHref}" target="_blank" rel="noopener" style="display:inline-block; padding:${SPACING.w1} ${SPACING.w3}; color:${COLORS.white}; text-decoration:none; font-family:${FONT_STACK}; font-weight:500; font-size:${FONT_SIZE.md};">${safeLabel}</a>
</td>
</tr>
</table>`;
}
export function paragraph(text) {
    return `<p style="margin:0 0 ${SPACING.w2}; font-family:${FONT_STACK}; font-size:${FONT_SIZE.md}; color:${COLORS.textDefault}; line-height:1.5;">${text}</p>`;
}
export function calloutWarning(html) {
    return `<div style="margin:${SPACING.w2} 0 ${SPACING.w3}; padding:${SPACING.w2}; background:${COLORS.warningBackground}; border-left:4px solid ${COLORS.warningText}; color:${COLORS.warningText}; font-family:${FONT_STACK}; font-size:${FONT_SIZE.sm}; line-height:1.5;">${html}</div>`;
}
