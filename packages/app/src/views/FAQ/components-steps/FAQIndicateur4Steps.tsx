/** @jsx jsx */
import { jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconPeople, IconGrow } from "../../../components/Icons";
import FAQStep from "../components/FAQStep";

function FAQIndicateur4Steps() {
  return (
    <Fragment>
      <FAQStep icon={<IconPeople valid={true} />}>
        Seules les salariées qui sont rentrées de congé maternité (ou
        d’adoption) durant la période de référence sont prises en considération.
      </FAQStep>

      <FAQStep icon={<IconGrow />}>
        Sont considérées <strong>comme augmentées</strong> toutes salariées{" "}
        <strong>revenues de congé maternité</strong> pendant l'année de
        référence et <strong>ayant bénéficié d'une augmentation</strong>{" "}
        (générale ou individuelle){" "}
        <strong>à leur retour avant la fin de cette même période.</strong>
      </FAQStep>

      <FAQStep icon={<IconGrow />}>
        S'il n'y a eu aucun retour de congé maternité (ou adoption) au cours de
        la période de référence, l’indicateur n’est pas calculable.
      </FAQStep>
      
      <FAQStep icon={<IconGrow />}>
        S'il n'y a eu aucune augmentation (individuelle ou collective) 
        au cours des congés maternité, l’indicateur n’est pas calculable.
      </FAQStep>
      
    </Fragment>
  );
}

export default FAQIndicateur4Steps;
