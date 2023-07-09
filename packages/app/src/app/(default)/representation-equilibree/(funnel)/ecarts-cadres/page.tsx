import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Card from "@codegouvfr/react-dsfr/Card";
import { Grid, GridCol } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

import { AlertEdition } from "../AlertEdition";
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
      <ClientAnimate>
        <AlertEdition />
      </ClientAnimate>

      <Alert
        severity="info"
        title="Motifs de non calculabilité"
        description="Les écarts de représentation Femmes‑Hommes parmi les cadres dirigeants sont incalculables lorsqu'il n'y aucun
          ou un seul cadre dirigeant."
        className={fr.cx("fr-mb-4w")}
      />

      <EcartsCadresForm />

      <Grid mt="4w">
        <GridCol>
          <Card
            title="Cadres dirigeants"
            desc="Sont considérés comme ayant la qualité de cadre dirigeant les cadres auxquels sont confiées des
                  responsabilités dont l'importance implique une grande indépendance dans l'organisation de leur emploi
                  du temps, qui sont habilités à prendre des décisions de façon largement autonome et qui perçoivent une
                  rémunération se situant dans les niveaux les plus élevés des systèmes de rémunération pratiqués dans
                  leur entreprise ou établissement."
            detail="Définition"
            enlargeLink
            linkProps={{
              href: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006902439/",
              target: "_blank",
            }}
          />
        </GridCol>
      </Grid>
    </>
  );
};

export default EcartsCadres;
