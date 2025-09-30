import * as Sentry from "@sentry/nextjs";

/**
 * Initialise un gestionnaire d'erreurs global pour les erreurs DOM
 */
export function initDOMErrorHandling() {
  window.addEventListener("error", event => {
    if (
      event.message.includes("Failed to execute 'removeChild' on 'Node'") ||
      event.message.includes("The node to be removed is not a child of this node")
    ) {
      const errorToCapture = event.error ?? new Error(event.message || "Unknown DOM error");
      Sentry.captureException(errorToCapture, {
        tags: {
          errorType: "DOM_REMOVE_CHILD_ERROR",
          component: "TextArea",
        },
        extra: {
          message: event.message,
          filename: event.filename,
          lineNumber: event.lineno,
          columnNumber: event.colno,
          timestamp: new Date().toISOString(),
        },
      });

      event.preventDefault();
      console.warn("Erreur DOM interceptée et enregistrée:", event.message);
    }
  });
}

/**
 * Nettoie le texte pour le copier-coller
 */
export function sanitizeClipboardText(text: string): string {
  if (typeof text !== "string") {
    return "";
  }

  const cleanedText = text
    .normalize("NFC")
    .replace(/\u00A0/g, " ")
    .replace(/[\uFEFF\u200B-\u200F\u202A-\u202E]/g, "");

  return cleanedText
    .split("")
    .filter(char => {
      const code = char.charCodeAt(0);
      return (code > 31 && code < 127) || code === 9 || code === 10 || code === 13 || code > 159;
    })
    .join("")
    .replace(/\s+/g, " ");
}
