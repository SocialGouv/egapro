/** @jsx jsx */
import { jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconText } from "../../../components/Icons";

import FAQStep from "../components/FAQStep";
import FAQTitle3 from "../components/FAQTitle3";

function FAQResultatDetailCalcul() {
  return (
    <Fragment>
      <FAQTitle3>Calculer l’index</FAQTitle3>

      <FAQStep icon={<IconText>1</IconText>}>
        Additionner les notes obtenues aux 5 indicateurs.
        <br />
        Si un indicateur n’est pas calculable, il ne sera pas pris en compte
        dans le calcul de l’index.
      </FAQStep>
    </Fragment>
  );
}

export default FAQResultatDetailCalcul;
