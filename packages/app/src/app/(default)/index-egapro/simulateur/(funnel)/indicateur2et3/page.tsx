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
        className={fr.cx("fr-mb-2w")}
        severity="info"
        title="Aide au calcul"
        description={
          <p>
            La notion d’augmentation individuelle correspond à une augmentation individuelle du salaire de base du
            salarié concerné y compris celle liée à une promotion. L’indicateur n’est pas calculable:
            <br />
            <ul>
              <li>s’il n’a eu aucune augmentation au cours de la période de référence</li>
              <li>
                si le total des effectifs retenus est inférieur à 40% des effectifs pris en compte pour le calcul des
                indicateurs
              </li>
            </ul>
            Pour en savoir plus sur le calcul de cet indicateur,{" "}
            <Link target="_blank" href="/aide-simulation#indicateur-ecart-de-taux-d-augmentation-50-250-salaries">
              cliquez ici
            </Link>
          </p>
        }
      />
      <p>
        Renseigner le nombre de femmes et d'hommes ayant été augmentés durant la période de référence. Il s'agit des
        augmentations individuelles du salaire de base, y compris celles liées à une promotion.
      </p>
      <Alert
        className="fr-mb-3w"
        small
        severity="info"
        description="La période choisie pour le calcul de cet indicateur peut correspondre à la période de référence annuelle, ou inclure la ou les deux années précédentes. Si une période pluriannuelle est choisie, elle peut être révisée tous les trois ans."
      />
      <Indic2and3Form />
    </CenteredContainer>
  );
};

export default Indicateur2et3Page;
