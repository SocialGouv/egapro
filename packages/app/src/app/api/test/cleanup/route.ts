import { sql } from "@api/shared-domain/infra/db/postgres";
import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint pour nettoyer les données de test (utilisé par les tests e2e)
 * Protégé par un token secret E2E_CLEANUP_TOKEN
 * IMPORTANT: Désactivé en production pour des raisons de sécurité
 */
export async function POST(request: NextRequest) {
  try {
    // Bloquer l'accès en production (uniquement sur le domaine de prod pour permettre les tests e2e)
    const hostname = request.headers.get("host") || "";
    const isProductionHost = hostname.includes("egapro.travail.gouv.fr");

    if (isProductionHost) {
      return NextResponse.json(
        { error: "Prod - Endpoint non disponible" },
        { status: 404 },
      );
    }

    // Vérifier le token d'authentification
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.E2E_CLEANUP_TOKEN;

    // Si le token n'est pas configuré, l'endpoint est désactivé (sécurité)
    if (!expectedToken) {
      return NextResponse.json(
        { error: "Token - Endpoint non disponible" },
        { status: 404 },
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Token d'authentification invalide" },
        { status: 401 },
      );
    }

    // Récupérer les paramètres
    const body = await request.json();
    const { siren, year } = body;

    if (!siren || !year) {
      return NextResponse.json(
        { error: "Paramètres siren et year requis" },
        { status: 400 },
      );
    }

    // Supprimer la déclaration (idempotent : pas d'erreur si elle n'existe pas)
    const result = await sql`
      DELETE FROM representation_equilibree
      WHERE siren = ${siren} AND year = ${year}
    `;

    return NextResponse.json({
      success: true,
      message:
        result.count > 0
          ? `Déclaration supprimée: SIREN ${siren}, année ${year}`
          : `Aucune déclaration à supprimer pour le SIREN ${siren} et l'année ${year}`,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la déclaration:", error);
    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
