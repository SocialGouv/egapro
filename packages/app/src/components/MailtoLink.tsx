import { useUser } from "@services/apiClient";

export const MailtoLinkForNonOwner = () => {
  const { user } = useUser();

  return (
    <>
      <p>Le Siren saisi n'est pas rattaché à votre email de connexion ({user?.email}).</p>
      <p>
        Vous devez faire une demande de rattachement en nous envoyant votre Siren et votre email à{" "}
        <a style={{ whiteSpace: "nowrap" }} href="mailto:dgt.ega-pro@travail.gouv.fr">
          dgt.ega-pro@travail.gouv.fr
        </a>
        .
      </p>
    </>
  );
};
