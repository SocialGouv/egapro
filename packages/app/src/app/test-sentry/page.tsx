import { config } from "@common/config";
import { SentryTest } from "@components/utils/SentryTest";
import { type Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Test Sentry - Egapro",
  description: "Page de test pour l'intégration de Sentry",
};

export default function TestSentryPage() {
  // Vérifier l'environnement et rediriger si ce n'est pas un environnement de développement
  const environment = config.env;
  if (environment === "production") {
    redirect("/"); // Redirection vers la page d'accueil en production
  }
  return (
    <main>
      <div className="fr-container fr-my-8w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10 fr-col-lg-8">
            <h1>Test de l'intégration Sentry</h1>
            <p className="fr-text--lg fr-mb-3w">
              Cette page permet de tester l'intégration de Sentry dans l'application Egapro. Utilisez les boutons
              ci-dessous pour générer des erreurs et vérifier qu'elles sont bien capturées par Sentry.
            </p>

            <SentryTest />

            <div className="fr-callout fr-mt-4w">
              <h3 className="fr-callout__title">Comment vérifier que Sentry fonctionne ?</h3>
              <p>
                Après avoir déclenché une erreur, vous devriez pouvoir la voir dans le tableau de bord Sentry. Vérifiez
                que les informations suivantes sont correctement capturées :
              </p>
              <ul>
                <li>Le message d'erreur</li>
                <li>La stack trace</li>
                <li>Les informations sur le navigateur et l'environnement</li>
                <li>Le contexte de l'erreur</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
