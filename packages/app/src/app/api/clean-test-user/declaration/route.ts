import { declarationRepo, ownershipRepo, representationEquilibreeRepo } from "@api/core-domain/repo";
import { assertServerSession } from "@api/utils/auth";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { Email, PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Liste des emails autorisés à utiliser cette API
const AUTHORIZED_EMAIL = "egapro-e2e@fabrique.social.gouv.fr";

/**
 * Route API pour supprimer les déclarations de test lié à l'email
 * Cette route n'est accessible qu'aux utilisateurs dont l'email est dans la liste AUTHORIZED_EMAILS
 */
export async function POST() {
  try {
    // Vérifier si l'utilisateur est authentifié
    const session = await assertServerSession();
    const userEmail = session.user.email;
    const currentYear = new Date().getFullYear();
    const lastYear = new PositiveNumber(currentYear - 1);

    // Vérifier si l'email de l'utilisateur est autorisé
    if (!userEmail || AUTHORIZED_EMAIL != userEmail) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à effectuer cette action" }, { status: 403 });
    }

    // Récupérer toutes les déclarations des emails autorisés
    // Convertir les chaînes de caractères en objets Email
    const sirens = await ownershipRepo.getAllSirenByEmail(new Email(AUTHORIZED_EMAIL));

    // Supprimer chaque déclaration
    let deletedCount = 0;
    for (const siren of sirens) {
      await declarationRepo.delete([new Siren(siren), lastYear]);
      await representationEquilibreeRepo.delete([new Siren(siren), lastYear]);
      deletedCount++;
    }

    // Renvoyer une réponse de succès
    return NextResponse.json({
      success: true,
      message: `${deletedCount} déclarations ont été supprimées avec succès`,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des déclarations:", error);

    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la suppression des déclarations",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
