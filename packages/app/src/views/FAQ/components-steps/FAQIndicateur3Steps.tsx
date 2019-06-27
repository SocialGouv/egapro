/** @jsx jsx */
import { jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconLamp, IconGrow } from "../../../components/Icons";
import FAQStep from "../components/FAQStep";

function FAQIndicateur3Steps() {
  return (
    <Fragment>
      <FAQStep icon={<IconGrow valid={true} />}>
        La notion de promotion correspond au{" "}
        <strong>
          passage à un niveau ou coefficient hierarchique supérieur.
        </strong>
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        Les groupes ne comportant pas{" "}
        <strong>au moins 10 femmes et 10 hommes</strong> ne sont pas retenus
        pour le calcul.
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        Si aucune promotion n'est intervenue au cours de la période de
        référence, l’indicateur n’est pas calculable.
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        Si le total des effectifs retenus est inférieur à 40% des effectifs pris
        en compte pour le calcul des indicateurs, l’indicateur n’est pas
        calculable.
      </FAQStep>
    </Fragment>
  );
}

export default FAQIndicateur3Steps;
