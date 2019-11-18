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
        y ait eu des augmentations durant la période de calcul de l'indicateur.
      </FAQStep>

      <FAQStep icon={<IconText>1</IconText>}>
        Calculer le nombre de femmes et d’hommes augmentés au cours de la
        période de calcul de l'indicateur.
      </FAQStep>

      <FAQStep icon={<IconText>2</IconText>}>
        Calculer le taux d'augmentation des femmes en rapportant le nombre de
        femmes augmentées au nombre total de femmes salariées. Calculer de la
        même façon le taux d'augmentation des hommes.
      </FAQStep>

      <FAQStep icon={<IconText>3a</IconText>}>
        Un premier résultat est la valeur absolue de l'écart entre les deux taux
        calculés en 2. Cet écart est mesuré en "points de pourcentage". Exemple
        d'un taux d'augmentation des femmes de <em>33,13%</em> et d'un taux
        d'augmentation des hommes de <em>30,00%</em> d'où un écart de{" "}
        <em>3,13</em> points de pourcentage : la note sera calculée sur la
        donnée <em>3,13</em>.
      </FAQStep>

      <FAQStep icon={<IconText>3b</IconText>}>
        Un second résultat est "l'écart en nombre équivalent de salariés" :
        l'écart de taux calculé en 3a est appliqué au plus petit effectif entre
        les femmes et les hommes. Il correspond au plus petit nombre de salariés
        qu'il aurait fallu augmenter ou ne pas augmenter pour être à égalité des
        taux d'augmentation. Exemple d'un écart de <em>3,13</em> points de
        pourcentage dans une entreprise employant 15 femmes et 20 hommes : on
        applique <em>3,13%</em> à 15 femmes, pour un nombre équivalent de
        salariés de <em>0,4695</em>.
      </FAQStep>

      <FAQStep icon={<IconText>4</IconText>}>
        Les données 3a et 3b sont enfin arrondies à une décimale, et la plus
        petite donnée est utilisée pour le calcul de la note finale, car étant
        la plus avantageuse. En reprenant l'exemple ci-dessus, c'est la donnée
        3b arrondie (0,5) qui sera conservée, pour une note finale de 35 points.
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
