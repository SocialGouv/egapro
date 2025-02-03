"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useCallback } from "react";

export const SentryTest = () => {
  const triggerError = useCallback(() => {
    // Log configuration and start of error test
    console.log("Starting Sentry test with config:", {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_EGAPRO_ENV,
    });

    console.log("Triggering test error - this should be caught by the error boundary...");

    // Create and throw an error that will be caught by the error boundary
    try {
      // Create an error with a stack trace by actually throwing it
      throw new Error("Test error for Sentry integration");
    } catch (e) {
      const error = e as Error;
      error.name = "SentryTestError";
      error.cause = "Manual test trigger";
      throw error;
    }
  }, []);

  return (
    <div className="fr-container fr-py-3w">
      <Button onClick={triggerError}>Trigger Sentry test error</Button>
    </div>
  );
};
