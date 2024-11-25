import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { CenteredContainer, Link } from "@design-system";

import { NAVIGATION } from "../navigation";
import { Indic2and3Form } from "./Form";

const { title } = NAVIGATION.indicateur2et3;

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const Indicateur2et3Page = () => {
  return (
    <CenteredContainer pb="4w">
      <Alert
        className={fr.cx("fr-mb-4w")}
        severity="info"
        title="Aide au calcul"
        description={
          <p>
            La notion d’augmentation individuelle correspond à une augmentation individuelle du salaire de base du
            salarié concerné y compris celle liée à une promotion.
            <br />
            La période de référence choisie pour le calcul de cet indicateur peut correspondre à la période de référence
            annuelle, ou inclure la ou les deux années précédentes. Si une période pluriannuelle est choisie, elle peut
            être révisée tous les trois ans.
            <br />
            L'indicateur n'est pas calculable si aucune augmentation individuelle n'est intervenue au cours de la
            période de référence considérée ou si l’effectif total pris en compte pour le calcul des indicateurs ne
            compte pas au moins 5 femmes et 5 hommes. <br />
            Pour en savoir plus sur le calcul de cet indicateur,{" "}
            <Link target="_blank" href="/aide-index#indicateur-ecart-de-taux-d-augmentation-50-250-salaries">
              cliquez ici
            </Link>
          </p>
        }
      />
      <Indic2and3Form />
    </CenteredContainer>
  );
};

export default Indicateur2et3Page;
