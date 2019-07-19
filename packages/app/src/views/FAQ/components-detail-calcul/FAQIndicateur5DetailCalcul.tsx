/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconLamp } from "../../../components/Icons";

import FAQStep from "../components/FAQStep";
import FAQCalculScale from "../components/FAQCalculScale";
import FAQTitle3 from "../components/FAQTitle3";

function FAQIndicateur5DetailCalcul() {
  return (
    <Fragment>
      <FAQTitle3>Calculer l’indicateur</FAQTitle3>

      <FAQStep icon={<IconLamp />}>
        Comparer le nombre de femmes et le nombre d’hommes comptant parmi les 10
        plus hautes rémunérations de l’entreprise.
      </FAQStep>

      <div css={styles.content}>
        <FAQTitle3>Appliquer le barème pour obtenir votre note</FAQTitle3>

        <FAQCalculScale
          listTitle="nombre de personnes sexes sous représenté"
          list={["4 ou 5 salariés", "2 ou 3 salariés", "0 ou 2 salariés"]}
          scaleTitle="note sur 15"
          scale={["15 points", "5 points", "0 point"]}
        />
      </div>
    </Fragment>
  );
}

const styles = {
  content: css({
    marginTop: 30
  })
};

export default FAQIndicateur5DetailCalcul;
