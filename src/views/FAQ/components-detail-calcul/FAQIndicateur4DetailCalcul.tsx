import React, { Fragment } from "react"
import { Box, Text } from "@chakra-ui/react"

import { IconText } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"
import FAQCalculScale from "../components/FAQCalculScale"
import FAQTitle3 from "../components/FAQTitle3"

const FAQIndicateur4DetailCalcul = () => (
  <Fragment>
    <FAQTitle3>Calculer l’indicateur</FAQTitle3>
    <FAQStep icon={<IconText>1</IconText>}>
      <Text>
        L’indicateur correspond au ratio entre le nombre de salariées revenues de congé maternité ou d’adoption pendant
        la période de référence et ayant bénéficié d’une augmentation, avant la fin de celle-ci, si des augmentations
        ont eu lieu pendant leur congé, d’une part; et, d’autre part, le nombre de salariés revenus, pendant la période
        de référence, de congé maternité ou d’adoption, durant lequel il y a eu des augmentations salariales.
      </Text>
    </FAQStep>
    <Box mt={6}>
      <FAQTitle3>Appliquer le barème pour obtenir votre note</FAQTitle3>
      <FAQCalculScale
        listTitle="pourcentage"
        list={["égal à 100% ", "inférieur à 100%"]}
        scaleTitle="note sur 15"
        scale={["15 points", "0 point"]}
      />
    </Box>
  </Fragment>
)

export default FAQIndicateur4DetailCalcul
