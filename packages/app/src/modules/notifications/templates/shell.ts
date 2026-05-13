export function wrapEmail(title: string, bodyHtml: string): string {
	return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #161616; line-height: 1.5;">
<div style="max-width: 600px; margin: 0 auto; padding: 24px;">
<h1 style="font-size: 20px; margin-bottom: 16px;">${escapeHtml(title)}</h1>
${bodyHtml}
<hr style="margin: 32px 0; border: none; border-top: 1px solid #dddddd;">
<p style="font-size: 12px; color: #666666;">
Cet e-mail a été envoyé automatiquement par la plateforme Egapro. Merci de ne pas y répondre.
</p>
</div>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function formatFrenchDate(iso: string): string {
	const date = new Date(iso);
	return date.toLocaleDateString("fr-FR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}
