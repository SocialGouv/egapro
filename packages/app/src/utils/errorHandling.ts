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
      Sentry.captureException(event.error, {
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
  return text.replace(/[^\x20-\x7E]/g, "").replace(/\u00A0/g, " ");
}
