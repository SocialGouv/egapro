import { type NextRequest, NextResponse } from "next/server";

import { env } from "~/env.js";
import { API_V1_OPENAPI } from "~/modules/routes";
import { isNonce, NONCE_HEADER } from "~/server/security/securityHeaders.js";

export function GET(request: NextRequest) {
	if (env.NEXT_PUBLIC_EGAPRO_ENV === "prod") {
		return new NextResponse(null, { status: 404 });
	}

	// The value lands in raw HTML: anything but a nonce of ours is dropped.
	const header = request.headers.get(NONCE_HEADER);
	const nonce = isNonce(header) ? header : "";

	const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>EGAPRO — Documentation API</title>
  <link rel="stylesheet" href="/swagger-ui/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script nonce="${nonce}" src="/swagger-ui/swagger-ui-bundle.js"></script>
  <script nonce="${nonce}" src="/swagger-ui/swagger-ui-standalone-preset.js"></script>
  <script nonce="${nonce}">
    SwaggerUIBundle({
      url: "${API_V1_OPENAPI}?v=" + Date.now(),
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset,
      ],
      layout: "StandaloneLayout",
    });
  </script>
</body>
</html>`;

	return new NextResponse(html, {
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}
