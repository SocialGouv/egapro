/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment } from "react";

import { IconLamp, IconText } from "../../../components/Icons";

import FAQStep from "../components/FAQStep";
import FAQCalculScale from "../components/FAQCalculScale";
import FAQTitle3 from "../components/FAQTitle3";

function FAQIndicateur2et3DetailCalcul() {
  return (
    <Fragment>
      <FAQTitle3>Calculer l’indicateur</FAQTitle3>

      <FAQStep icon={<IconLamp />}>
        Pour que le calcul soit possible il faut que les effectifs pris en
        compte comptent <strong>au moins 5 femmes et 5 hommes</strong>, et qu'il
        y ai eu des augmentations durant la période de déclaration.
      </FAQStep>

      <FAQStep icon={<IconText>1</IconText>}>
        Calculer le nombre de femmes et d’hommes augmentés au cours de la
        période de déclaration.
      </FAQStep>

      <FAQStep icon={<IconText>2</IconText>}>
        Calculer le taux que représente le nombre de femmes augmentées par
        rapport au nombre total de femmes employées, et le nombre d'hommes
        augmentés par rapport au nombre total d'hommes employés
      </FAQStep>

      <FAQStep icon={<IconText>3a</IconText>}>
        Une première donnée est la valeur absolue de l'écart entre les deux taux
        calculés en 2. Cet écart est utilisé en "points de pourcentage". Exemple
        d'un écart de <em>3.1%</em> : la note sera calculée sur la donnée{" "}
        <em>3.1</em>.
      </FAQStep>

      <FAQStep icon={<IconText>3b</IconText>}>
        Une deuxième donnée est "l'écart en équivalent nombre de salariés" :
        l'écart de taux calculé en 3a est appliqué au plus petit effectif, pour
        calculer le plus petit nombre d'employés qu'il aurait fallu augmenter ou
        ne pas augmenter pour être à égalité. Exemple d'un écart de{" "}
        <em>3.1%</em> dans une entreprise employant 15 femmes et 20 hommes : on
        applique <em>3.1%</em> à 15 femmes, pour un nombre équivalent de
        salariés de <em>0.465</em>.
      </FAQStep>

      <FAQStep icon={<IconText>4</IconText>}>
        Les donnés 3a et 3b sont enfin arrondies à une décimale, et la plus
        petite donnée est utilisée pour le calcul de la note finale, car étant
        la plus avantageuse. Pour reprendre les exemples ci-dessus, c'est la
        donnée 3b arrondie (0.5) qui sera conservée, pour une note finale de 35
        points.
      </FAQStep>

      <div css={styles.content}>
        <FAQTitle3>Appliquer le barème pour obtenir votre note</FAQTitle3>

        <FAQCalculScale
          listTitle="écart"
          list={[
            "inférieur ou égal à 2",
            "supérieur à 2 ou égal à 5",
            "supérieur à 5 ou égal à 10",
            "supérieur à 10"
          ]}
          scaleTitle="note sur 15"
          scale={["35 points", "25 points", "15 points", "0 point"]}
        />

        <FAQStep icon={<IconLamp />}>
          Si l’écart constaté joue en faveur du sexe le moins bien rémunéré
          (indicateur 1), la note maximale de 35 points est attribuée à
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

export default FAQIndicateur2et3DetailCalcul;
