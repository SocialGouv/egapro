/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconPeople, IconLamp, IconGrow } from "../../../components/Icons";
import FAQStep from "../components/FAQStep";

function FAQIndicateur4Steps() {
  return (
    <Fragment>
      <FAQStep icon={<IconPeople valid={true} />}>
        Seules les salariées qui sont rentrées de congé maternité (ou
        d’adoption) durant la période de référence sont prises en considération.
      </FAQStep>

      <FAQStep icon={<IconPeople valid={false} />}>
        Les femmes n’étant pas rentrées physiquement de congés maternité (ou
        d’adoption) durant la période de référence ne sont pas prises en
        considération.
      </FAQStep>

      <FAQStep icon={<IconGrow />}>
        Sont considérées <strong>comme augmentées</strong> toutes salariées{" "}
        <strong>revenues de congé maternité</strong> pendant l'année de
        référence et <strong>ayant bénéficié d'une augmentation</strong>{" "}
        (générale ou individuelle){" "}
        <strong>à leur retour avant la fin de cette même période.</strong>
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        <p>L’indicateur ne peut-être calculé seulement :</p>
        <ul css={styles.list}>
          <li>
            • si il y a eu des augmentations (individuelles ou collectives) au
            cours de la periode de référence
          </li>
          <li>
            • si il y a eu des retours de congé maternité (ou adoption) durant
            la période de référence
          </li>
        </ul>
      </FAQStep>
    </Fragment>
  );
}

const styles = {
  list: css({
    padding: 0,
    margin: 0,
    listStyle: "none",
    marginTop: 6
  })
};

export default FAQIndicateur4Steps;
