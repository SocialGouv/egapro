import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
<<<<<<< HEAD
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

import { AlertEdition } from "../AlertEdition";
=======

>>>>>>> 526270801b46296844cd14907305b0eeee086d21
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
<<<<<<< HEAD
      <ClientAnimate>
        <AlertEdition />
      </ClientAnimate>
=======
      {/* <AlertEdition /> */}
>>>>>>> 526270801b46296844cd14907305b0eeee086d21
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
