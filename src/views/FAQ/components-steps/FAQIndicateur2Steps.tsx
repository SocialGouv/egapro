import React, { Fragment } from "react"
import { Text } from "@chakra-ui/react"

import { IconLamp, IconMoney, IconGrow } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"

const FAQIndicateur2Steps = () => (
  <Fragment>
    <Text>
      <strong>Indicateur concernant les entreprises de plus de 250 salariés</strong>
    </Text>
    <FAQStep icon={<IconMoney />} isValid="valid">
      <Text>
        La notion d'
        <strong>
          augmentation individuelle correspond à une augmentation individuelle du salaire de base du salarié concerné.
        </strong>
      </Text>
    </FAQStep>
    <FAQStep icon={<IconGrow />} isValid="invalid">
      <Text>
        La notion d’augmentation individuelle pour le calcul de cet indicateur exclut les augmentations de salaires
        liées à une promotion.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconLamp />}>
      <Text>
        Les groupes ne comportant pas <strong>au moins 10 femmes et 10 hommes</strong> ne sont pas retenus pour le
        calcul.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconLamp />}>
      <Text>
        Si aucune augmentation individuelle n'est intervenue au cours de la période de référence, l’indicateur n’est pas
        calculable.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconLamp />}>
      <Text>
        Si le total des effectifs retenus est inférieur à 40% des effectifs pris en compte pour le calcul des
        indicateurs, l'indicateur n'est pas calculable.
      </Text>
    </FAQStep>
  </Fragment>
)

export default FAQIndicateur2Steps
