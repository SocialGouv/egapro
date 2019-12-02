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
        Les indicateurs calculables doivent représenter au moins 75 points de l’Index pour que celui-ci soit calculable.
        <br />
        Le nombre total de points ainsi obtenus est ramené sur 100 en appliquant la règle de la proportionnalité.
      </FAQStep>
    </Fragment>
  );
}

export default FAQResultatDetailCalcul;
