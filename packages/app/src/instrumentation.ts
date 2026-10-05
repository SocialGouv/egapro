import * as Sentry from "@sentry/nextjs";

// Never ship credentials to Sentry.
const SENSITIVE_HEADERS = ["authorization", "cookie", "proxy-authorization", "set-cookie", "x-api-key", "api-key"];

// Values committed in the repository (config default, .env.* files): public, so never valid outside dev.
const DEV_JWT_SECRETS = ["secret", "sikretfordevonly"];

/**
 * Refuse to start a production server that signs sessions with a default/committed secret (or none):
 * anyone could forge a staff session. Reads the raw env var because `config.env` defaults to "dev".
 */
export const assertJwtSecretIsSet = (env: NodeJS.ProcessEnv = process.env) => {
  if (env.NODE_ENV !== "production" || env.NEXT_PUBLIC_EGAPRO_ENV === "dev") return;
  const secret = env.SECURITY_JWT_SECRET;
  if (!secret || DEV_JWT_SECRETS.includes(secret)) {
    throw new Error("SECURITY_JWT_SECRET must be set to a non-default value outside dev.");
  }
};

// Hook to capture errors from nested React Server Components
export const onRequestError = (
  error: Error,
  requestInfo: { method: string; route: string; url: string },
  request: Request,
) => {
  Sentry.captureException(error, {
    extra: {
      ...requestInfo,
      requestHeaders: Object.fromEntries(
        [...request.headers.entries()].filter(([key]) => !SENSITIVE_HEADERS.includes(key.toLowerCase())),
      ),
    },
  });
};

// Helper for wrapping server actions with Sentry instrumentation
export const withServerAction = <T>(
  name: string,
  action: () => Promise<T>,
  options?: {
    formData?: FormData;
    headers?: Headers;
    recordResponse?: boolean;
  },
) => {
  return Sentry.withServerActionInstrumentation(
    name,
    {
      formData: options?.formData,
      headers: options?.headers,
      recordResponse: options?.recordResponse ?? false,
    },
    action,
  );
};

/**
 * Next.js instrumentation hook: the Sentry SDK (v9+) no longer injects `sentry.server.config.ts` /
 * `sentry.edge.config.ts` itself, each runtime loads its own configuration here.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Next 14 only logs an error thrown here and keeps serving 500s: exit so the deployment fails visibly.
    try {
      assertJwtSecretIsSet();
    } catch (error) {
      console.error((error as Error).message);
      process.exit(1);
    }

    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
