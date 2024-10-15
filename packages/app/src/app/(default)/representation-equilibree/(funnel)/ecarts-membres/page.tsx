import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";

import { TITLES } from "../titles";
import { EcartsMembresForm } from "./Form";

const title = TITLES["ecarts-membres"];

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const EcartsMembres = () => {
  return (
    <>
      <Alert
        severity="info"
        title="Définition"
        description={
          <span>
            Est considérée comme instance dirigeante toute instance mise en place au sein de la société, par tout acte
            ou toute pratique sociétaire, aux fins d'assister régulièrement les organes chargés de la direction générale
            dans l'exercice de leurs missions{" "}
            <span className="no-break">
              (
              <a
                rel="nofollow"
                href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044566715"
                target="_blank"
              >
                Article L23-12-1
              </a>
              ).
            </span>
          </span>
        }
        className={fr.cx("fr-mb-4w")}
      />

      <EcartsMembresForm />
    </>
  );
};

export default EcartsMembres;
