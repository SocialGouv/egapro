import Alert from "@codegouvfr/react-dsfr/Alert";
import { type NextServerPageProps } from "@common/utils/next";
import { CenteredContainer } from "@design-system";
import * as Sentry from "@sentry/nextjs";
import { notFound } from "next/navigation";

import { Footer } from "../Footer";
import { Header } from "../Header";

const controlledErrors: Record<string, string | { message: string; source: string }> = {
  AccessDenied: {
    source: "login",
    message: "Vous n'êtes pas staff.",
  },
};

const ControlledErrorPage = ({ searchParams }: NextServerPageProps<never, "error" | "source">) => {
  const errorCode = searchParams.error;
  const error = controlledErrors[`${errorCode}`];
  const source = `${searchParams.source}`;

  // Capture l'erreur contrôlée avec Sentry
  if (errorCode) {
    Sentry.captureMessage(`Erreur contrôlée: ${errorCode}`, {
      level: "error",
      tags: {
        errorType: "controlled",
        errorCode: String(errorCode),
        source: String(source),
      },
      contexts: {
        error: {
          code: errorCode,
          source,
          details: JSON.stringify(error),
        },
        runtime: {
          environment: process.env.NEXT_PUBLIC_EGAPRO_ENV || "dev",
          type: "server",
          component: "ControlledErrorPage",
        },
      },
    });

    console.log("Erreur contrôlée capturée:", {
      code: errorCode,
      source,
      details: error,
    });
  }

  if (!error) {
    notFound();
  }

  const errorMessage = typeof error === "object" ? (source == error.source ? error.message : notFound()) : error;

  return (
    <>
      <Header />
      <main role="main" id="content" className="grow">
        <CenteredContainer py="6w">
          <Alert title="Erreur" severity="error" description={errorMessage} />
        </CenteredContainer>
      </main>
      <Footer />
    </>
  );
};

export default ControlledErrorPage;
