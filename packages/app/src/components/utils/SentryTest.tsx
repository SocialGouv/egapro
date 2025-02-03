"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useCallback } from "react";

export const SentryTest = () => {
  const triggerError = useCallback(() => {
    // Log configuration for debugging
    console.log("Sentry Configuration:", {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });

    // Create and throw an error to be automatically captured by Sentry
    const error = new Error("Test error for Sentry integration");
    error.name = "SentryTestError";
    throw error;
  }, []);

  return (
    <div className="fr-container fr-py-3w">
      <Button onClick={triggerError}>Trigger Sentry test error</Button>
    </div>
  );
};
