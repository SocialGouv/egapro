import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";

import { EntrepriseForm } from "./Form";

const title = "Informations entreprise";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const InformationsEntreprise = () => {
  return (
    <>
      {/* <AlertEdition /> */}
      <Alert
        small
        severity="info"
        className={fr.cx("fr-mb-4w")}
        description="Les informations relatives à l'entreprise (raison sociale, Code NAF, Adresse complète) sont renseignées
          automatiquement et sont non modifiables (source : Répertoire Sirene de l'INSEE)."
      />

      <EntrepriseForm />
    </>
  );
};

export default InformationsEntreprise;
