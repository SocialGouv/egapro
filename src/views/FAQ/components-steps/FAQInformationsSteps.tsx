import React, { Fragment } from "react"
import { Text } from "@chakra-ui/react"

import { IconCalendar } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"

const FAQInformationsSteps = () => (
  <Fragment>
    <FAQStep icon={<IconCalendar />} isValid="valid">
      <Text>
        Les indicateurs sont calculés à partir des données de la période de référence annuelle choisie par l’entreprise.{" "}
        <strong>Cette période doit être de 12 mois consécutifs et précéder l’année de publication.</strong> Elle doit
        donc nécessairement s’achever au plus tard le 31 décembre 2019 pour un Index publié en 2020. Uniquement pour
        l’indicateur « écart de taux d’augmentations », et uniquement pour une entreprise de 50 à 250 salariés,
        l’employeur peut choisir une période de référence de 3 ans maximum. Ce caractère pluriannuel peut être révisé
        tous les 3 ans.
      </Text>
    </FAQStep>
  </Fragment>
)

export default FAQInformationsSteps
