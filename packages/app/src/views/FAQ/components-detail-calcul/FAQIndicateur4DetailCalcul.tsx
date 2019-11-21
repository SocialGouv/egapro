/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconText } from "../../../components/Icons";

import FAQStep from "../components/FAQStep";
import FAQCalculScale from "../components/FAQCalculScale";
import FAQTitle3 from "../components/FAQTitle3";

function FAQIndicateur4DetailCalcul() {
  return (
    <Fragment>
      <FAQTitle3>Calculer l’indicateur</FAQTitle3>

      <FAQStep icon={<IconText>1</IconText>}>
        Comparer le nombre de salariées ayant bénéficié d’une augmentation à
        leur retour de congé maternité (avant la fin de la période de référence)
        au total de salariées de retour de congé maternité et dont leur congé à
        eu lieu durant une période d’augmentation
      </FAQStep>

      <div css={styles.content}>
        <FAQTitle3>Appliquer le barème pour obtenir votre note</FAQTitle3>

        <FAQCalculScale
          listTitle="pourcentage"
          list={["égal à 100% ", "inférieur à 100%"]}
          scaleTitle="note sur 15"
          scale={["15 points", "0 point"]}
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

export default FAQIndicateur4DetailCalcul;
