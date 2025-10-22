import Alert from "@codegouvfr/react-dsfr/Alert";
import { notFound } from "next/navigation";

const controlledErrors: Record<string, string | { message: string; source: string }> = {
  AccessDenied: {
    source: "login",
    message: "Vous n'êtes pas staff.",
  },
};

const ControlledErrorPage = ({ searchParams }) => {
  const error = controlledErrors[`${searchParams.error}`];
  const source = `${searchParams.source}`;

  if (!error) {
    notFound();
  }

  const errorMessage = typeof error === "object" ? (source == error.source ? error.message : notFound()) : error;

  return (
    <>
      <main role="main" id="content" className="grow">
        <Alert title="Erreur" severity="error" description={errorMessage} />
      </main>
    </>
  );
};

export default ControlledErrorPage;
