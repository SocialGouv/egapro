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
        L’indicateur correspond au ratio entre le nombre de salariées 
        revenues de congé maternité ou d’adoption pendant la période de 
        référence et ayant bénéficié d’une augmentation, avant la fin de 
        celle-ci, si des augmentations ont eu lieu pendant leur congé, 
        d’une part; et, d’autre part, le nombre de salariés revenus, 
        pendant la période de référence, de congé maternité ou d’adoption, 
        durant lequel il y a eu des augmentations salariales
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
