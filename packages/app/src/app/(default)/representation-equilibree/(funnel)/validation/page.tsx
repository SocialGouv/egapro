import { Heading } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import Link from "next/link";

import { AlertEdition } from "../AlertEdition";
import { ValidationRecapRepEq } from "./RecapRepEq";

const title = "Validation";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Validation = () => {
  return (
    <>
      <ClientAnimate>
        <AlertEdition />
      </ClientAnimate>

      <p>
        Vous êtes sur le point de valider la procédure vous permettant de transmettre aux services du ministre chargé du
        travail vos écarts éventuels de représentation femmes‑hommes conformément aux dispositions de l’
        <Link
          href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045669617"
          target="_blank"
          rel="noopener noreferrer"
        >
          article D. 1142-19 du code du travail
        </Link>
        .
      </p>
      <p>
        Pour terminer la procédure, cliquez sur “Valider et transmettre les résultats” ci-dessous. Vous recevrez un
        accusé de réception par email.
      </p>
      <Heading as="h2" mt="6w" text="Récapitulatif" />

      <ValidationRecapRepEq />
    </>
  );
};

export default Validation;
