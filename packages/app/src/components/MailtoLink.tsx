import type { PropsWithChildren } from "react";

export type Props = PropsWithChildren<{
  email: string;
  siren?: string;
}>;

export const MailtoLinkForNonOwner = ({ siren = "", email }: Props) => {
  return (
    <>
      <p>L'email saisi n'est pas rattaché au Siren de votre entreprise.</p>
      <p>
        Vous devez faire une demande de rattachement en indiquant votre Siren et email en cliquant&nbsp;
        <a
          href={`mailto:dgt.ega-pro@travail.gouv.fr?subject=EgaPro - Demander à être déclarant d'un SIREN&body=Bonjour, je souhaite être déclarant pour le SIREN ${siren}. Mon email de déclaration est ${email}. Cordialement.`}
        >
          ici&nbsp;
        </a>
        &nbsp;(si ce lien ne fonctionne pas, vous pouvez nous envoyer votre Siren et email à<br />
        dgt.ega-pro@travail.gouv.fr).
      </p>
    </>
  );
};
