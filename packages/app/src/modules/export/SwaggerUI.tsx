"use client";

import Script from "next/script";
import { useRef } from "react";
import { API_V1_OPENAPI } from "~/modules/routes";

type Props = { specUrl?: string; nonce?: string };

export function SwaggerUI({ specUrl = API_V1_OPENAPI, nonce }: Props) {
	const initializedRef = useRef(false);

	const tryInit = () => {
		if (initializedRef.current) return;
		if (!window.SwaggerUIBundle || !window.SwaggerUIStandalonePreset) return;
		initializedRef.current = true;

		window.SwaggerUIBundle({
			url: specUrl,
			dom_id: "#swagger-ui",
			deepLinking: true,
			presets: [
				window.SwaggerUIBundle.presets.apis,
				window.SwaggerUIStandalonePreset,
			],
			layout: "StandaloneLayout",
		});
	};

	return (
		<>
			<link href="/swagger-ui/swagger-ui.css" rel="stylesheet" />
			<Script
				nonce={nonce}
				onLoad={tryInit}
				src="/swagger-ui/swagger-ui-bundle.js"
				strategy="afterInteractive"
			/>
			<Script
				nonce={nonce}
				onLoad={tryInit}
				src="/swagger-ui/swagger-ui-standalone-preset.js"
				strategy="afterInteractive"
			/>
			<div id="swagger-ui" />
		</>
	);
}
