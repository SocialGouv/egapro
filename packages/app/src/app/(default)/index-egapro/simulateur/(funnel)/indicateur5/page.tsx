import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { CenteredContainer, Link } from "@design-system";

import { TITLES } from "../navigation";
import { Indic5Form } from "./Form";

const title = TITLES.indicateur5;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur5Page = () => {
  return (
    <CenteredContainer mb="4w">
      <Alert
        className={fr.cx("fr-mb-2w")}
        severity="info"
        title="Aide au calcul"
        description={
          <p>
            Le nombre de salariés du sexe sous-représenté est calculé en comparant le nombre de femmes et le nombre
            d’hommes parmi les 10 plus hautes rémunérations.
            <br />
            Pour en savoir plus sur le calcul de cet indicateur,{" "}
            <Link
              target="_blank"
              href="/aide-simulation#indicateur-nombre-de-salaries-du-sexe-sous-represente-parmi-les-10-plus-hautes-remunerations"
            >
              cliquez ici
            </Link>
          </p>
        }
      />
      <p>
        Renseigner le nombre de femmes et d'hommes parmi les 10 plus hautes rémunérations durant la période de référence
      </p>
      <Indic5Form />
    </CenteredContainer>
  );
};

export default Indicateur5Page;
