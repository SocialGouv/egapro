import React, { Fragment } from "react"
import { Text } from "@chakra-ui/react"

import { IconPeople, IconGrow } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"

const FAQIndicateur4Steps = () => (
  <Fragment>
    <FAQStep icon={<IconPeople />} isValid="valid">
      <Text>
        Seules les salariées qui sont rentrées de congé maternité (ou d’adoption) durant la période de référence sont
        prises en considération.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconGrow />}>
      <Text>
        Sont considérées <strong>comme augmentées</strong> toutes salariées <strong>revenues de congé maternité</strong>{" "}
        pendant l'année de référence et <strong>ayant bénéficié d'une augmentation</strong> (générale ou individuelle){" "}
        <strong>à leur retour avant la fin de cette même période.</strong>
      </Text>
    </FAQStep>
    <FAQStep icon={<IconGrow />}>
      <Text>
        S'il n'y a eu aucun retour de congé maternité (ou adoption) au cours de la période de référence, l’indicateur
        n’est pas calculable.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconGrow />}>
      <Text>
        S'il n'y a eu aucune augmentation (individuelle ou collective) au cours des congés maternité, l’indicateur n’est
        pas calculable.
      </Text>
    </FAQStep>
  </Fragment>
)

export default FAQIndicateur4Steps
