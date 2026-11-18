import { areTestRoutesEnabled } from "@api/utils/testRoutes";

export const dynamic = "force-dynamic";

/**
 * Déclencheur de crash pour la recette d'observabilité : l'erreur est captée par
 * `onRequestError` (src/instrumentation.ts) et doit arriver dans Sentry. Hors dev,
 * la route répond 404 comme les autres routes de test (voir @api/utils/testRoutes).
 */
export async function GET() {
  if (!areTestRoutesEnabled()) {
    return new Response("Not found", { status: 404 });
  }
  throw new Error("Sentry server test error");
}
