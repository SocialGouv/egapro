"use client";

import Script from "next/script";
import { useRef } from "react";

function initSwagger() {
	if (!window.SwaggerUIBundle || !window.SwaggerUIStandalonePreset) return;

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
}

export function SwaggerUI() {
	const initializedRef = useRef(false);

	const tryInit = () => {
		if (initializedRef.current) return;
		if (!window.SwaggerUIBundle || !window.SwaggerUIStandalonePreset) return;
		initializedRef.current = true;
		initSwagger();
	};

	return (
		<>
			<link
				href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
				rel="stylesheet"
			/>
			<Script
				onLoad={tryInit}
				src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
				strategy="afterInteractive"
			/>
			<Script
				onLoad={tryInit}
				src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
				strategy="afterInteractive"
			/>
			<div id="swagger-ui" />
		</>
	);
}
