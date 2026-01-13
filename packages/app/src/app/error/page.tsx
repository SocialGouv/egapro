import Alert from "@codegouvfr/react-dsfr/Alert";
import { type NextServerPageProps } from "@common/utils/next";
import { CenteredContainer } from "@design-system";
import { notFound } from "next/navigation";

import { Footer } from "../Footer";
import { Header } from "../Header";

const controlledErrors: Record<string, string | { message: string; source: string }> = {
  AccessDenied: {
    source: "login",
    message: "Vous n'êtes pas staff.",
  },
};

const ControlledErrorPage = async ({ searchParams }: { searchParams: Promise<Partial<Record<"error" | "source", string | string[]>>> }) => {
  const sParams = await searchParams;
  const error = controlledErrors[`${sParams.error}`];
  const source = `${sParams.source}`;

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
