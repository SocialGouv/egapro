"use client";

import Script from "next/script";
import { useRef } from "react";

export function SwaggerUI() {
	const initializedRef = useRef(false);

	const tryInit = () => {
		if (initializedRef.current) return;
		if (!window.SwaggerUIBundle || !window.SwaggerUIStandalonePreset) return;
		initializedRef.current = true;

		window.SwaggerUIBundle({
			url: "/api/v1/openapi.json",
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
				onLoad={tryInit}
				src="/swagger-ui/swagger-ui-bundle.js"
				strategy="afterInteractive"
			/>
			<Script
				onLoad={tryInit}
				src="/swagger-ui/swagger-ui-standalone-preset.js"
				strategy="afterInteractive"
			/>
			<div id="swagger-ui" />
		</>
	);
}
