import { useUser } from "./AuthContext";

export const MailtoLinkForNonOwner = () => {
  const { user } = useUser();

  return (
    <>
      <p>Le Siren saisi n'est pas rattaché à votre email de connexion ({user?.email}).</p>
      <p>
        Vous devez faire une demande de rattachement en nous envoyant votre Siren et votre email à{" "}
        <span style={{ whiteSpace: "nowrap" }}>dgt.ega-pro@travail.gouv.fr</span>.
      </p>
    </>
  );
};
