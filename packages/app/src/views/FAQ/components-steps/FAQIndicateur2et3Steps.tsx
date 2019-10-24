/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconLamp, IconGrow } from "../../../components/Icons";
import FAQStep from "../components/FAQStep";

function FAQIndicateur2et3Steps() {
  return (
    <Fragment>
      <FAQStep icon={<IconGrow valid={true} />}>
        La notion d'
        <strong>
          augmentation individuelle correspond à une augmentation individuelle
          du salaire de base du salarié concerné.
        </strong>
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        La notion d’augmentation individuelle pour le calcul de cet indicateur{" "}
        <strong>inclut</strong> les augmentations de salaire liées à une
        promotion.
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        L'indicateur est calculé <strong>au niveau de l'entreprise</strong>, et
        non par groupes de salariés.
      </FAQStep>

      <FAQStep icon={<IconLamp />}>
        <p>L’indicateur n’est pas calculable :</p>
        <ul css={styles.list}>
          <li>
            • Si aucune augmentation individuelle n'est intervenue au cours de
            la période de référence,
          </li>
          <li>
            • Ou si l’effectif pris en compte pour le calcul des indicateurs ne
            comporte pas au moins 5 femmes et 5 hommes.
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

export default FAQIndicateur2et3Steps;
