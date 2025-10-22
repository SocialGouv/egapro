"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

/**
 * Composant pour tester l'intégration de Sentry
 * Ce composant permet de déclencher des erreurs pour vérifier que Sentry les capture correctement
 */
export function SentryTest() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTestClientError = () => {
    try {
      // Déclencher une erreur intentionnellement
      throw new Error("Test d'erreur client pour Sentry");
    } catch (error) {
      if (error instanceof Error) {
        // Capturer l'erreur avec Sentry
        Sentry.captureException(error);
        setErrorMessage("Erreur client envoyée à Sentry");
        console.error("Erreur client capturée par Sentry:", error);
      }
    }
  };

  return (
    <div className="fr-container fr-my-4w">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <div className="fr-card fr-p-3w">
            <h2>Test de l'intégration Sentry</h2>
            <p>
              Utilisez les boutons ci-dessous pour tester l'intégration de Sentry et vérifier que les erreurs sont bien
              capturées.
            </p>

            <div className="fr-btns-group fr-btns-group--inline">
              <Button onClick={handleTestClientError}>Tester une erreur client</Button>
              <Button
                linkProps={{
                  href: "/api/test-sentry-error?trigger=true",
                  target: "_blank",
                }}
              >
                Tester une erreur serveur
              </Button>
            </div>

            {errorMessage && (
              <div className="fr-alert fr-alert--info fr-mt-2w">
                <p>{errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
