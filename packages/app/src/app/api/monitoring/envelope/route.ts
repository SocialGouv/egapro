import { config } from "@common/config";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * The tunnel only relays events for OUR Sentry project: the DSN comes from configuration,
 * and an envelope that names another project or key is refused. Otherwise anyone could use
 * this endpoint as an open relay to any project on the Sentry instance.
 */
function getConfiguredDsn(): { projectId: string; publicKey: string } | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  try {
    const dsnUrl = new URL(dsn);
    const projectId = dsnUrl.pathname.split("/").filter(Boolean).pop();
    if (!projectId || !/^\d+$/.test(projectId) || !dsnUrl.username) return null;
    return { projectId, publicKey: dsnUrl.username };
  } catch {
    return null;
  }
}

/** The tunnel is only called by our own front: CORS is limited to the canonical origin, without credentials. */
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  let allowedOrigin: string | null = null;
  try {
    allowedOrigin = new URL(process.env.NEXTAUTH_URL || config.host).origin;
  } catch {
    // No canonical origin configured: same-origin requests don't need CORS headers anyway.
  }
  if (!origin || origin !== allowedOrigin) return {};
  return { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
}

export async function POST(request: NextRequest) {
  const sentryUrl = process.env.SENTRY_URL;
  if (!sentryUrl) {
    console.error("Sentry URL not configured");
    return new Response("Sentry URL not configured", { status: 500 });
  }

  const configuredDsn = getConfiguredDsn();
  if (!configuredDsn) {
    console.error("Sentry DSN not configured");
    return new Response("Sentry DSN not configured", { status: 500 });
  }
  const { projectId, publicKey } = configuredDsn;

  try {
    // Get the raw body
    const body = await request.text();
    // console.log("Received envelope body:", body);
    // console.log("Envelope body length:", body.length);
    // console.log("Envelope newlines count:", (body.match(/\n/g) || []).length);
    // Parse envelope format (newline-delimited JSON)

    // Split into lines
    const lines = body.split("\n");
    if (lines.length < 2) {
      console.error("Invalid envelope format: missing parts");
      return new Response("Invalid envelope format", { status: 400 });
    }

    const headerRaw = lines[0];
    const items: string[] = [];

    // Process lines after header to build items with proper newlines
    let i = 1;
    while (i < lines.length) {
      const itemHeaderLine = lines[i];
      if (!itemHeaderLine || itemHeaderLine.trim() === "") {
        i++;
        continue;
      }

      try {
        // Try to parse item header
        const itemHeader = JSON.parse(itemHeaderLine);
        if (!itemHeader.type) {
          i++;
          continue;
        }

        // Found an item header, collect payload until next item header or end
        const itemPayloadLines: string[] = [];
        i++;
        while (i < lines.length) {
          const payloadLine = lines[i];
          // Stop if we hit an empty line or another item header
          if (payloadLine.trim() === "") {
            i++;
            continue;
          }
          try {
            const parsed = JSON.parse(payloadLine);
            if (parsed.type) {
              break;
            }
          } catch (e) {
            // Not a header, add to payload
          }
          itemPayloadLines.push(payloadLine);
          i++;
        }

        // Add item with its payload, ensuring proper newlines
        if (itemPayloadLines.length > 0) {
          // For items with payload: header + \n + payload
          items.push(itemHeaderLine + "\n" + itemPayloadLines.join("\n"));
        } else {
          // For header-only items: just the header
          items.push(itemHeaderLine);
        }

        // Log item structure for debugging
        // console.log("Added item:", {
        //   type: itemHeader.type,
        //   hasPayload: itemPayloadLines.length > 0,
        //   payloadLines: itemPayloadLines.length,
        // });
      } catch (e) {
        // Not a valid item header, skip
        i++;
      }
    }

    // Log parsed items with detailed structure
    // items.forEach((item, index) => {
    //   console.log(`Item ${index} structure:`, {
    //     content: item,
    //     length: item.length,
    //     newlines: (item.match(/\n/g) || []).length,
    //     endsWithNewline: item.endsWith("\n"),
    //   });
    // });

    // Reconstruct envelope with proper format:
    // header + \n\n + item1 + \n\n + item2 + \n\n
    const envelope = headerRaw + "\n\n" + items.join("\n");

    // Log detailed envelope structure
    // console.log("Envelope structure:", {
    //   headerLength: headerRaw.length,
    //   itemsCount: items.length,
    //   totalLength: envelope.length,
    //   newlines: (envelope.match(/\n/g) || []).length,
    //   firstNewlineAt: envelope.indexOf("\n"),
    //   headerAndFirstItem: envelope.split("\n").slice(0, 3),
    // });

    try {
      // Parse header
      const header = JSON.parse(headerRaw);

      // An envelope that names a DSN must name ours.
      if (header.dsn) {
        const dsnUrl = new URL(header.dsn);
        if (dsnUrl.pathname.split("/").filter(Boolean).pop() !== projectId || dsnUrl.username !== publicKey) {
          return new Response("Unknown Sentry DSN", { status: 403 });
        }
      }
    } catch (e) {
      console.error("Failed to parse envelope header:", e);
      return new Response("Invalid envelope header", { status: 400 });
    }

    // Forward the request to Sentry's envelope endpoint
    const sentryResponse = await fetch(`${sentryUrl}/api/${projectId}/envelope/`, {
      method: "POST",
      credentials: "omit", // Don't send cookies for client-side error reporting
      headers: {
        // Forward original headers needed for client error reporting
        "Content-Type": "text/plain;charset=UTF-8",
        Accept: "*/*",
        // Always authenticate with the configured key, never with a client-provided one.
        "X-Sentry-Auth": `Sentry sentry_key=${publicKey},sentry_version=7,sentry_client=sentry.javascript.nextjs/8.0.0`,
      },
      // Use reconstructed envelope with proper newlines
      body: envelope,
    });

    if (sentryResponse.status === 403) {
      console.error("Sentry authentication failed:", {
        responseStatus: sentryResponse.status,
        responseStatusText: sentryResponse.statusText,
        sentryError: sentryResponse.headers.get("X-Sentry-Error"),
        url: `${sentryUrl}/api/${projectId}/envelope/`,
      });

      // Try to get response body for more error details
      try {
        const errorBody = await sentryResponse.clone().text();
        console.error("Sentry error response body:", errorBody);
      } catch (e) {
        console.error("Could not read error response body");
      }
    }

    // console.log("Sentry response:", {
    //   status: sentryResponse.status,
    //   statusText: sentryResponse.statusText,
    //   error: sentryResponse.headers.get("X-Sentry-Error"),
    // });

    // Get Sentry response headers we want to forward
    const sentryHeaders = ["X-Sentry-Error", "X-Sentry-Rate-Limits", "Retry-After"];

    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/plain;charset=UTF-8",
      "Access-Control-Expose-Headers": "X-Sentry-Error, X-Sentry-Rate-Limits, Retry-After",
      ...getCorsHeaders(request),
    };

    // Forward specific Sentry headers if they exist
    for (const header of sentryHeaders) {
      const value = sentryResponse.headers.get(header);
      if (value) {
        responseHeaders[header] = value;
        // console.log(`Forwarding header ${header}:`, value);
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
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Accept, Content-Type, X-Sentry-Auth",
      "Access-Control-Expose-Headers": "X-Sentry-Error, X-Sentry-Rate-Limits, Retry-After",
      "Access-Control-Max-Age": "86400",
      ...getCorsHeaders(request),
    },
  });
}
