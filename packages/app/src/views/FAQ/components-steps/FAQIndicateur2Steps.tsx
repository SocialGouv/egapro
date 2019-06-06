/** @jsx jsx */
import { jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconLamp, IconMoney, IconGrow } from "../../../components/Icons";
import FAQStep from "../components/FAQStep";

function FAQIndicateur2Steps() {
  return (
    <Fragment>
      <FAQStep icon={<IconMoney valid={true} />}>
        La notion d'
        <strong>
          augmentation individuelle correspond à une augmentation individuelle
          du salaire de base du salarié concerné
        </strong>
      </FAQStep>

      <FAQStep icon={<IconGrow valid={false} />}>
        La notion d’augmentation individuelle pour le calcul de cet index exclue
        les augmentations de salaires liées à une promotion
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        Les groupes ne comportant pas{" "}
        <strong>au moins 10 hommes et 10 femmes</strong> ne sont pas retenus
        pour le calcul
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        Si le total des effectifs pouvant être pris en compte est inférieur à
        40% des effectifs totaux, l’indicateur n’est pas calculable
      </FAQStep>
    </Fragment>
  );
}

export default FAQIndicateur2Steps;
