import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";

import { TITLES } from "../titles";
import { EcartsCadresForm } from "./Form";

const title = TITLES["ecarts-cadres"];

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const EcartsCadres = () => {
  return (
    <>
      <Alert
        severity="info"
        title="Définition"
        description={
          <span>
            Sont considérés comme ayant la qualité de cadre dirigeant les cadres auxquels sont confiées des
            responsabilités dont l'importance implique une grande indépendance dans l'organisation de leur emploi du
            temps, qui sont habilités à prendre des décisions de façon largement autonome et qui perçoivent une
            rémunération se situant dans les niveaux les plus élevés des systèmes de rémunération pratiqués dans leur
            entreprise ou établissement (
            <a rel="nofollow" href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902439/">
              Article L3111-2
            </a>
            ).
          </span>
        }
        className={fr.cx("fr-mb-4w")}
      />

      <EcartsCadresForm />
    </>
  );
};

export default EcartsCadres;
