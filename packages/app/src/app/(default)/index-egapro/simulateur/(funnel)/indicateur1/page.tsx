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
              est reconstituée en équivalent temps plein sur la période de référence annuelle considérée. <br />
              L'indicateur est calculé soit par catégorie socio-professionnelle, soit, après consultation du CSE, par
              niveau ou coefficient hiérarchique en application de la classification de branche ou d’une autre méthode
              de cotation des postes. <br />
              L'indicateur n'est pas calculable si l'effectif total retenu est inférieur à 40% de l'effectif total pris
              en compte pour le calcul des indicateurs. <br />
              Pour en savoir plus sur le calcul de cet indicateur,{" "}
              <Link target="_blank" href="/aide-index#indicateur-ecart-de-remuneration">
                cliquez ici
              </Link>
            </p>
          }
        />
      </CenteredContainer>
      <Indic1Form />
    </>
  );
};

export default Indicateur1Page;
