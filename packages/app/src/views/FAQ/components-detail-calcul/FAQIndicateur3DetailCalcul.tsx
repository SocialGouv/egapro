/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconLamp, IconText } from "../../../components/Icons";

import FAQStep from "../components/FAQStep";
import FAQCalculScale from "../components/FAQCalculScale";
import FAQTitle3 from "../components/FAQTitle3";

function FAQIndicateur3DetailCalcul() {
  return (
    <Fragment>
      <FAQTitle3>Calculer l’indicateur</FAQTitle3>

      <FAQStep icon={<IconLamp />}>
        Les groupes ne comportant pas{" "}
        <strong>au moins 10 hommes et 10 femmes</strong> ne sont pas retenus
        pour le calcul.
      </FAQStep>

      <FAQStep icon={<IconText>1</IconText>}>
        Calculer le pourcentage de femmes et d’hommes promus au cours de la
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
        <FAQTitle3>Appliquer le barème pour obtenir votre note</FAQTitle3>

        <FAQCalculScale
          listTitle="écart"
          list={[
            "inférieur ou égal à 2% ",
            "supérieur à 2% ou égal à 5%",
            "supérieur à 5% ou égal à 10%",
            "supérieur à 10%"
          ]}
          scaleTitle="note sur 15"
          scale={["15 points", "10 points", "5 points", "0 point"]}
        />

        <FAQStep icon={<IconLamp />}>
          Si l’écart constaté joue en faveur du sexe le moins bien rémunéré
          (indicateur 1), la note maximale de 15 points est attribuée à
          l’entreprise (considérant que l’employeur a mis en place une politique
          de rattrapage adaptée)
        </FAQStep>
      </div>
    </Fragment>
  );
}

const styles = {
  content: css({
    marginTop: 30
  })
};

export default FAQIndicateur3DetailCalcul;
