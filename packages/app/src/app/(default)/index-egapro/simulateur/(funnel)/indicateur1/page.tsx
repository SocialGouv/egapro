import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { CenteredContainer, Link } from "@design-system";

import { TITLES } from "../navigation";
import { Indic1Form } from "./Form";

const title = TITLES.indicateur1;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur1Page = () => {
  return (
    <>
      <CenteredContainer>
        <Alert
          className={fr.cx("fr-mb-2w")}
          severity="info"
          title="Aide au calcul"
          description={
            <p>
              La rémunération prend en compte les salaires, bonus, primes collectives, indemnités de congés payés. Elle
              est reconstituée en équivalent temps plein sur toute la durée de la période de référence. <br />
              L'indicateur et l'index ne sont pas calculables si le total des effectifs des groupes (comptant au moins 3
              femmes et 3 hommes) est inférieur à 40% des effectifs totaux. <br />
              Pour en savoir plus sur le calcul de cet indicateur,{" "}
              <Link target="_blank" href="/aide-simulation#indicateur-ecart-de-remuneration">
                cliquez ici
              </Link>
            </p>
          }
        />
        <p>
          Les rémunérations annuelles moyennes des femmes et des hommes doivent être renseignées par catégorie de postes
          équivalents (soit par CSP, soit par niveau ou coefficient hiérarchique en application de la classification de
          branche ou d’une autre méthode de cotation des postes après consultation du CSE) et par tranche d’âge.
        </p>
      </CenteredContainer>
      <Indic1Form />
    </>
  );
};

export default Indicateur1Page;
