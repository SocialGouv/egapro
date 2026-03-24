import { NextResponse } from "next/server";

import { env } from "~/env.js";

export function GET() {
	if (env.NEXT_PUBLIC_EGAPRO_ENV === "prod") {
		return new NextResponse(null, { status: 404 });
	}

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
  <script src="/swagger-ui/swagger-ui-bundle.js"></script>
  <script src="/swagger-ui/swagger-ui-standalone-preset.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/api/v1/openapi.json",
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
