import React, { Fragment } from "react"
import { VStack, Box, Text } from "@chakra-ui/react"

import { IconLamp, IconText } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"
import FAQCalculScale from "../components/FAQCalculScale"
import FAQTitle3 from "../components/FAQTitle3"

const FAQIndicateur2DetailCalcul = () => (
  <Fragment>
    <FAQTitle3>Calculer l’indicateur</FAQTitle3>
    <VStack spacing={4}>
      <FAQStep icon={<IconLamp />}>
        <Text>
          Les groupes ne comportant pas <strong>au moins 10 hommes et 10 femmes</strong> ne sont pas retenus pour le
          calcul.
        </Text>
      </FAQStep>
      <FAQStep icon={<IconText>1</IconText>}>
        <Text>
          Calculer le pourcentage de femmes et d’hommes augmentés au cours de la période de référence par catégories
          socio-professionnelles.
        </Text>
      </FAQStep>
      <FAQStep icon={<IconText>2</IconText>}>
        <Text>Puis soustraire pour chaque groupe le pourcentage de femmes augmentées à celui des hommes augmenté.</Text>
      </FAQStep>
      <FAQStep icon={<IconText>3</IconText>}>
        <Text>
          Pondérer les résultats obtenus en fonction de l’effectif du groupe par rapport à l’effectif total des groupes
          valides.
        </Text>
      </FAQStep>
      <FAQStep icon={<IconText>4</IconText>}>
        <Text>
          Enfin additionner les résultats des différents groupes pour obtenir l’ecart global de taux de d'augmentation
          entre les hommes et les femmes.
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
          "inférieur ou égal à 2% ",
          "supérieur à 2% ou égal à 5%",
          "supérieur à 5% ou égal à 10%",
          "supérieur à 10%",
        ]}
        scaleTitle="note sur 20"
        scale={["20 points", "10 points", "5 points", "0 point"]}
      />
      <Box mt={4}>
        <FAQStep icon={<IconLamp />}>
          <Text>
            Si l’écart constaté joue en faveur du sexe le moins bien rémunéré (indicateur 1), la note maximale de 20
            points est attribuée à l’entreprise (considérant que l’employeur a mis en place une politique de rattrapage
            adaptée)
          </Text>
        </FAQStep>
      </Box>
    </Box>
  </Fragment>
)

export default FAQIndicateur2DetailCalcul
