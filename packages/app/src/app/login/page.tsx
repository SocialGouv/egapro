"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Rediriger vers la page d'accueil si l'utilisateur est déjà connecté
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/");
    }
  }, [session, status, router]);

  const handleProConnectLogin = async () => {
    await signIn("proconnect", { callbackUrl: "/" });
  };

  return (
    <div className={fr.cx("fr-container", "fr-py-8v")}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--center")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-8", "fr-col-lg-6")}>
          <div className={fr.cx("fr-card", "fr-p-4v")}>
            <h1 className={fr.cx("fr-h3", "fr-mb-4v")}>Connexion à Egapro</h1>

            <p>Pour accéder à votre espace personnel Egapro, connectez-vous avec votre compte ProConnect.</p>

            <div className={fr.cx("fr-btns-group", "fr-btns-group--inline", "fr-mt-4v")}>
              <Button
                onClick={handleProConnectLogin}
                priority="primary"
                size="large"
                iconId="fr-icon-account-circle-line"
              >
                Se connecter avec ProConnect
              </Button>
            </div>

            <div className={fr.cx("fr-mt-4v")}>
              <h2 className={fr.cx("fr-h5")}>Qu'est-ce que ProConnect ?</h2>
              <p>
                ProConnect est le service d'identité numérique de l'État pour les professionnels. Il vous permet de vous
                connecter de manière sécurisée aux services en ligne de l'administration.
              </p>
              <p>
                <a
                  href="https://proconnect.gouv.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={fr.cx("fr-link")}
                >
                  En savoir plus sur ProConnect
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
