import { useUser } from "@services/apiClient";

import { NextLinkOrA } from "../design-system/utils/NextLinkOrA";

type Props = {
  siren?: string;
};

export const MailtoLinkForNonOwner = ({ siren }: Props) => {
  const { user } = useUser();

  return (
    <p>
      Votre email de connexion <b>{user?.email}</b> n'est pas rattaché au numéro Siren de l'entreprise
      {siren ? " " + siren : ""}. Vous devez faire une demande de rattachement en remplissant le formulaire{" "}
      <NextLinkOrA href="/ajout-declarant">ici</NextLinkOrA>.
    </p>
  );
};
