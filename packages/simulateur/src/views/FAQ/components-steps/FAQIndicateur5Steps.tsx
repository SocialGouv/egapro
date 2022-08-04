import React, { Fragment } from "react"
import { Text } from "@chakra-ui/react"

import { IconMoney } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"

const FAQIndicateur5Steps = () => (
  <Fragment>
    <FAQStep icon={<IconMoney />} isValid="valid">
      <Text>Renseignez le nombre de femmes et d'hommes parmi les dix plus hautes rémunérations de l’entreprise.</Text>
    </FAQStep>
  </Fragment>
)

export default FAQIndicateur5Steps
