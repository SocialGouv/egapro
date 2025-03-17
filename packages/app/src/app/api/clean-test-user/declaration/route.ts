import { declarationRepo } from "@api/core-domain/repo";
import { assertServerSession } from "@api/utils/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Liste des emails autorisés à utiliser cette API
const AUTHORIZED_EMAILS = [
  "egapro-e2e@fabrique.social.gouv.fr",
  // Ajoutez d'autres emails autorisés ici
];

/**
 * Route API pour supprimer les déclarations de test lié à l'email
 * Cette route n'est accessible qu'aux utilisateurs dont l'email est dans la liste AUTHORIZED_EMAILS
 */
export async function POST() {
  try {
    // Vérifier si l'utilisateur est authentifié
    const session = await assertServerSession();
    const userEmail = session.user.email;

    // Vérifier si l'email de l'utilisateur est autorisé
    if (!userEmail || !AUTHORIZED_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à effectuer cette action" }, { status: 403 });
    }

    // Récupérer toutes les déclarations
    const declarations = await declarationRepo.getAll();

    // Supprimer chaque déclaration
    let deletedCount = 0;
    for (const declaration of declarations) {
      if (declaration.declarant.email.getValue() === userEmail) {
        await declarationRepo.delete([declaration.siren, declaration.year]);
      }
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
