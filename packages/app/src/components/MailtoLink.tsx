import { useUser } from "@services/apiClient";
import NextLink from "next/link";

export const MailtoLinkForNonOwner = () => {
  const { user } = useUser();

  return (
    <p>
      Votre email de connexion <a href={`mailto:${user?.email}`}>{user?.email}</a> n'est pas rattaché au numéro Siren de
      l'entreprise. Vous devez faire une demande de rattachement en remplissant le formulaire{" "}
      <NextLink href="/ajout-declarant">ici</NextLink>.
    </p>
  );
};
