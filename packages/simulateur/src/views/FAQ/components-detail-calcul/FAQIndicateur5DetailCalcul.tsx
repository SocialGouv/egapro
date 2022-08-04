import React, { Fragment } from "react"
import { Box, Text } from "@chakra-ui/react"

import { IconLamp } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"
import FAQCalculScale from "../components/FAQCalculScale"
import FAQTitle3 from "../components/FAQTitle3"

const FAQIndicateur5DetailCalcul = () => (
  <Fragment>
    <FAQTitle3>Calculer l’indicateur</FAQTitle3>
    <FAQStep icon={<IconLamp />}>
      <Text>
        Comparer le nombre de femmes et le nombre d’hommes comptant parmi les 10 plus hautes rémunérations de
        l’entreprise.
      </Text>
    </FAQStep>
    <Box mt={6}>
      <FAQTitle3>Appliquer le barème pour obtenir votre note</FAQTitle3>
      <FAQCalculScale
        listTitle="nombre de personnes du sexe sous-représenté"
        list={["4 ou 5 salariés", "2 ou 3 salariés", "0 ou 1 salarié"]}
        scaleTitle="note sur 10"
        scale={["10 points", "5 points", "0 point"]}
      />
    </Box>
  </Fragment>
)

export default FAQIndicateur5DetailCalcul
