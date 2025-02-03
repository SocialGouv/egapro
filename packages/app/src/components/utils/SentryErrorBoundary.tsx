"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type PropsWithChildren } from "react";

interface State {
  hasError: boolean;
}

export class SentryErrorBoundary extends Component<PropsWithChildren, State> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.log("Error caught by Sentry boundary:", error, errorInfo);
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fr-alert fr-alert--error fr-my-3w">
          <h3 className="fr-alert__title">Une erreur est survenue</h3>
          <p>L'erreur a été signalée automatiquement à notre équipe.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
