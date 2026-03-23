declare global {
	interface Window {
		SwaggerUIBundle: {
			(config: Record<string, unknown>): void;
			presets: { apis: unknown };
		};
		SwaggerUIStandalonePreset: unknown;
		__swaggerInit?: () => void;
	}
}

export {};
