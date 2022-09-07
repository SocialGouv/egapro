import React, { Fragment } from "react"
import { VStack, Box, Text } from "@chakra-ui/react"

import { IconLamp, IconText } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"
import FAQCalculScale from "../components/FAQCalculScale"
import FAQTitle3 from "../components/FAQTitle3"

const FAQIndicateur1DetailCalcul = () => (
  <Fragment>
    <FAQTitle3>Calculer l’indicateur</FAQTitle3>
    <VStack spacing={4}>
      <FAQStep icon={<IconLamp />}>
        <Text>
          Les groupes ne comportant pas <strong>au moins 3 hommes et 3 femmes</strong> ne sont pas retenus pour le
          calcul.
        </Text>
      </FAQStep>
      <FAQStep icon={<IconText>1</IconText>}>
        <Text>
          Calculer la rémunération moyenne des femmes et des hommes au cours de la période de référence par groupe.
        </Text>
      </FAQStep>
      <FAQStep icon={<IconText>2</IconText>}>
        <Text>
          Calculer l’écart de rémunération pour chaque groupe en soustrayant la rémunération moyenne des femmes à celle
          des hommes et en rapportant ce résultat à la rémunération moyenne des hommes.
        </Text>
      </FAQStep>
      <FAQStep icon={<IconText>3</IconText>}>
        <Text>
          Pondérer les résultats obtenus en fonction de l’effectif du groupe par rapport à l’effectif total des groupes
          valides.
        </Text>
      </FAQStep>
      <FAQStep icon={<IconText>4</IconText>}>
        <Text>
          Enfin additionner les résultats des différents groupes pour obtenir l’ecart global de rémunération entre les
          hommes et les femmes.
        </Text>
        <Text mt={1}>
          <em>* la valeur est exprimée en valeur absolue</em>
        </Text>
      </FAQStep>
    </VStack>
    <Box mt={6}>
      <FAQTitle3>Appliquer le barème pour obtenir votre note</FAQTitle3>
      <FAQCalculScale
        listTitle="écart"
        list={[
          "égal à 0% ",
          "supérieur à 0% ou égal à 1%",
          "supérieur à 1% ou égal à 2%",
          "supérieur à 2% ou égal à 3%",
          "supérieur à 3% ou égal à 4%",
          "supérieur à 4% ou égal à 5%",
          "supérieur à 5% ou égal à 6%",
          "supérieur à 6% ou égal à 7%",
          "supérieur à 7% ou égal à 8%",
          "supérieur à 8% ou égal à 9%",
          "supérieur à 9% ou égal à 10%",
          "supérieur à 10% ou égal à 11%",
          "supérieur à 11% ou égal à 12%",
          "supérieur à 12% ou égal à 13%",
          "supérieur à 13% ou égal à 14%",
          "supérieur à 14% ou égal à 15%",
          "supérieur à 15% ou égal à 16%",
          "supérieur à 16% ou égal à 17%",
          "supérieur à 17% ou égal à 18%",
          "supérieur à 18% ou égal à 19%",
          "supérieur à 19% ou égal à 20%",
          "supérieur à 20%",
        ]}
        scaleTitle="note sur 40"
        scale={[
          "40 points",
          "39 points",
          "38 points",
          "37 points",
          "36 points",
          "35 points",
          "34 points",
          "33 points",
          "31 points",
          "29 points",
          "27 points",
          "25 points",
          "23 points",
          "21 points",
          "19 points",
          "17 points",
          "14 points",
          "11 points",
          "8 points",
          "5 points",
          "2 points",
          "0 point",
        ]}
      />
    </Box>
  </Fragment>
)

export default FAQIndicateur1DetailCalcul
