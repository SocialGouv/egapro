import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";

import { PublicationForm } from "./Form";

const title = "Publication";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Publication = () => {
  return (
    <>
      {/* <AlertEdition /> */}

      <Alert
        severity="info"
        as="h2"
        title="Obligation de transparence"
        className={fr.cx("fr-mb-4w")}
        description={
          <>
            Les entreprises doivent publier chaque année, <strong>au plus tard le 1er mars</strong>, leurs écarts
            éventuels de représentation femmes-hommes pour les cadres dirigeants et au sein des instances dirigeantes de
            manière visible et lisible sur leur site internet, et les laisser en ligne jusqu’à la publication de leurs
            écarts l’année suivante. Si l’entreprise ne dispose pas de site internet, elle doit porter ces informations
            à la connaissance des salariés par tout moyen.
          </>
        }
      />

      <PublicationForm />
    </>
  );
};

export default Publication;
