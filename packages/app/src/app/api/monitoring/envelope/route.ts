import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sentryUrl = process.env.SENTRY_URL;
  if (!sentryUrl) {
    console.error("Sentry URL not configured");
    return new Response("Sentry URL not configured", { status: 500 });
  }

  try {
    // Parse DSN to get project details
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    let projectId: string | undefined;
    let publicKey: string | undefined;

    if (dsn) {
      try {
        const dsnUrl = new URL(dsn);
        projectId = dsnUrl.pathname.split("/")[1];
        publicKey = dsnUrl.username;
        console.log("Parsed DSN:", { projectId, publicKey });
      } catch (e) {
        console.warn("Could not parse DSN:", e);
      }
    }

    if (!projectId || !publicKey) {
      console.warn("Could not extract project details from DSN");
      return new Response("Could not parse Sentry DSN", { status: 500 });
    }

    // Get the original request URL and extract the path after /api/monitoring/envelope
    const originalUrl = new URL(request.url);
    const pathWithQuery = originalUrl.pathname.replace("/api/monitoring/envelope", "") + originalUrl.search;

    console.log("Forwarding request to Sentry store endpoint:", {
      url: `${sentryUrl}/api/${projectId}/store/?sentry_key=${publicKey}`,
      method: "POST",
      headers: Object.fromEntries(request.headers),
      originalPath: pathWithQuery,
    });

    // Get all headers from the request
    const headers = Object.fromEntries(request.headers);
    console.log("Received headers:", headers);

    // Get the auth token
    const authToken = process.env.SENTRY_AUTH_TOKEN;
    if (!authToken) {
      console.warn("SENTRY_AUTH_TOKEN not configured");
    }

    // Parse the original Sentry auth header
    const sentryAuthHeader = request.headers.get("X-Sentry-Auth");
    let parsedAuthKey: string | undefined;
    let parsedAuthVersion: string | undefined;

    if (sentryAuthHeader) {
      try {
        // Parse auth header format: Sentry sentry_key=xxx,sentry_version=7,...
        const authParts = sentryAuthHeader.replace("Sentry ", "").split(",");
        for (const part of authParts) {
          const [key, value] = part.trim().split("=");
          if (key === "sentry_key") parsedAuthKey = value;
          if (key === "sentry_version") parsedAuthVersion = value;
        }
        console.log("Parsed auth header:", { parsedAuthKey, parsedAuthVersion });
      } catch (e) {
        console.warn("Could not parse Sentry auth header:", e);
      }
    }

    // Get the request body and log it for debugging
    const body = await request.text();
    console.log("Received envelope body:", body.slice(0, 500) + (body.length > 500 ? "..." : ""));

    // Get origin for CORS headers
    const origin = request.headers.get("origin");

    // Forward the request to Sentry's store endpoint (no auth needed for client errors)
    const sentryResponse = await fetch(`${sentryUrl}/api/${projectId}/store/?sentry_key=${publicKey}`, {
      method: "POST",
      credentials: "omit", // Don't send cookies for client-side error reporting
      headers: {
        // Only essential headers for client error reporting
        "Content-Type": "application/json",
        Accept: "application/json",
        // Use minimal auth header
        "X-Sentry-Auth": `Sentry sentry_key=${publicKey},sentry_version=7`,
      },
      // Use the original request body without modifications
      body,
    });

    if (sentryResponse.status === 403) {
      console.error("Sentry authentication failed:", {
        requestHeaders: headers,
        responseStatus: sentryResponse.status,
        responseStatusText: sentryResponse.statusText,
        sentryError: sentryResponse.headers.get("X-Sentry-Error"),
        url: `${sentryUrl}/api/${projectId}/store/?sentry_key=${publicKey}`,
        body: body.slice(0, 500) + (body.length > 500 ? "..." : ""),
      });

      // Try to get response body for more error details
      try {
        const errorBody = await sentryResponse.clone().text();
        console.error("Sentry error response body:", errorBody);
      } catch (e) {
        console.error("Could not read error response body");
      }
    }

    console.log("Sentry response:", {
      status: sentryResponse.status,
      statusText: sentryResponse.statusText,
      error: sentryResponse.headers.get("X-Sentry-Error"),
    });

    // Get Sentry response headers we want to forward
    const sentryHeaders = ["X-Sentry-Error", "X-Sentry-Rate-Limits", "Retry-After"];

    // Get the request origin or default to *
    const requestOrigin = request.headers.get("origin") || "*";

    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": requestOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Expose-Headers": "X-Sentry-Error, X-Sentry-Rate-Limits, Retry-After",
      // Add Vary header when using dynamic origin
      ...(requestOrigin !== "*" ? { Vary: "Origin" } : {}),
    };

    // Forward specific Sentry headers if they exist
    for (const header of sentryHeaders) {
      const value = sentryResponse.headers.get(header);
      if (value) {
        responseHeaders[header] = value;
        console.log(`Forwarding header ${header}:`, value);
      }
    }

    // Return the response from Sentry with forwarded headers
    return new Response(await sentryResponse.text(), {
      status: sentryResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error forwarding to Sentry:", error);
    return new Response("Error forwarding to Sentry", { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  // Get the request origin or default to *
  const requestOrigin = request.headers.get("origin") || "*";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": requestOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Accept, Content-Type, X-Sentry-Auth, X-Client-Version, X-Client-IP",
    "Access-Control-Expose-Headers": "X-Sentry-Error, X-Sentry-Rate-Limits, Retry-After",
    "Access-Control-Max-Age": "86400",
  };

  // Add Vary header when using dynamic origin
  if (requestOrigin !== "*") {
    headers["Vary"] = "Origin";
  }

  return new Response(null, {
    status: 200,
    headers,
  });
}
