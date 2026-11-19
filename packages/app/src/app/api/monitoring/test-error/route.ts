import { areTestRoutesEnabled } from "@api/utils/testRoutes";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Déclencheur de crash pour la recette d'observabilité : l'erreur doit arriver dans
 * Sentry via l'instrumentation serveur (`onRequestError` de src/instrumentation.ts,
 * et l'auto-instrumentation des route handlers). Hors dev, la route répond 404
 * comme les autres routes de test (voir @api/utils/testRoutes).
 */
export async function GET() {
  if (!areTestRoutesEnabled()) {
    return NextResponse.json({ error: "Route désactivée" }, { status: 404 });
  }
  throw new Error("Sentry server test error");
}
