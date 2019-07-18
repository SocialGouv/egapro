/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconLamp, IconText } from "../../../components/Icons";
import FAQStep from "../components/FAQStep";

function FAQIndicateur1Steps() {
  return (
    <Fragment>
      <p css={styles.smallTitle}>Calculer l’indicateur</p>

      <FAQStep icon={<IconLamp />}>
        Les groupes ne comportant pas{" "}
        <strong>au moins 3 hommes et 3 femmes</strong> ne sont pas retenus pour
        le calcul.
      </FAQStep>

      <FAQStep icon={<IconText>1</IconText>}>
        Calculer le pourcentage de femmes et d’hommes augmentés au cours de la
        période de référence par catégories socio-professionnelles.
      </FAQStep>

      <FAQStep icon={<IconText>2</IconText>}>
        Puis soustraire pour chaque groupe le pourcentage de femmes promues à
        celui des hommes promus.
      </FAQStep>

      <FAQStep icon={<IconText>3</IconText>}>
        Pondérer les résultats obtenus en fonction de l’effectif du groupe par
        rapport à l’effectif total des groupes valides.
      </FAQStep>

      <FAQStep icon={<IconText>4</IconText>}>
        Enfin additionner les résultats des différents groupes pour obtenir
        l’ecart global de taux de promotion entre les hommes et les femmes.
        <br />
        <em>* la valeur est exprimée en valeur absolue</em>
      </FAQStep>

      <div css={styles.content}>
        <p css={styles.smallTitle}>
          Appliquer le barème pour obtenir votre note
        </p>
      </div>
    </Fragment>
  );
}

const styles = {
  smallTitle: css({
    paddingTop: 8,
    marginBottom: 8,
    fontSize: 14,
    lineHeight: "17px"
  }),
  content: css({
    marginTop: 30
  })
};

export default FAQIndicateur1Steps;
