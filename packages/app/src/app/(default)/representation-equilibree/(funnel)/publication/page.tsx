import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";

import { TITLES } from "../titles";
import { PublicationForm } from "./Form";

const title = TITLES.publication;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Publication = () => {
  return (
    <>
      <Alert
        severity="info"
        as="h2"
        title="Obligation de transparence"
        className={fr.cx("fr-mb-4w")}
        description={
          <>
            Les écarts de représentation, parmi les cadres dirigeants et les membres des instances dirigeantes, doivent
            être <strong>publiés de manière visible et lisible sur le site internet de l’entreprise</strong>, chaque
            année au plus tard le 1er mars, et devront rester en ligne au moins jusqu’à la publication des écarts
            l’année suivante.
            <br />
            En l’absence de site internet (au niveau de l’entreprise ou du groupe), les écarts doivent être communiqués
            aux salariés par tout moyen (courrier papier ou électronique, affichage…).
          </>
        }
      />

      <PublicationForm />
    </>
  );
};

export default Publication;
