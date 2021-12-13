import React, { Fragment } from "react"
import { Text } from "@chakra-ui/react"

import { IconText } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"
import FAQTitle3 from "../components/FAQTitle3"

const FAQResultatDetailCalcul = () => (
  <Fragment>
    <FAQTitle3>Calculer l’index</FAQTitle3>
    <FAQStep icon={<IconText>1</IconText>}>
      <Text>
        Les indicateurs calculables doivent représenter au moins 75 points de l’Index pour que celui-ci soit calculable.
      </Text>
      <Text mt={1}>
        Le nombre total de points ainsi obtenus est ramené sur 100 en appliquant la règle de la proportionnalité.
      </Text>
    </FAQStep>
  </Fragment>
)

export default FAQResultatDetailCalcul
