// Re-export Sentry client config so it can be imported via the ~/ alias.
// Turbopack does not run the webpack plugin that auto-injects sentry.client.config.ts,
// so we need to import it explicitly from the root layout.
import "../sentry.client.config";
