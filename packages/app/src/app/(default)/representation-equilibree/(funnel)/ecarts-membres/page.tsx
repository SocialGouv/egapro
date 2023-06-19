import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Card from "@codegouvfr/react-dsfr/Card";
import { Grid, GridCol } from "@design-system";
<<<<<<< HEAD
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";

import { AlertEdition } from "../AlertEdition";
=======

>>>>>>> 526270801b46296844cd14907305b0eeee086d21
import { EcartsMembresForm } from "./Form";

const title = "Écarts de représentation parmi les membres des instances dirigeantes";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const EcartsMembres = () => {
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
        severity="info"
        title="Motifs de non calculabilité"
<<<<<<< HEAD
        description="Les écarts de représentation femmes‑hommes parmi les membres des instances dirigeantes sont incalculables
=======
        description="Les écarts de représentation femmes-hommes parmi les membres des instances dirigeantes sont incalculables
>>>>>>> 526270801b46296844cd14907305b0eeee086d21
          lorsqu'il n'y a pas d'instance dirigeante."
        className={fr.cx("fr-mb-4w")}
      />

      <EcartsMembresForm />

      <Grid mt="4w">
        <GridCol>
          <Card
<<<<<<< HEAD
            title="Membres des instances dirigeantes"
=======
            title="CadresMembres des instances dirigeantes"
>>>>>>> 526270801b46296844cd14907305b0eeee086d21
            desc="Est considérée comme instance dirigeante toute instance mise en place au sein de la société, par tout
                  acte ou toute pratique sociétaire, aux fins d'assister régulièrement les organes chargés de la
                  direction générale dans l'exercice de leurs missions."
            detail="Définition"
            enlargeLink
            linkProps={{
              href: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044566715",
              target: "_blank",
            }}
          />
        </GridCol>
      </Grid>
    </>
  );
};

export default EcartsMembres;
