import React, { Fragment } from "react"
import { Text, UnorderedList, ListItem } from "@chakra-ui/react"

import { IconLamp, IconGrow } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"

const FAQIndicateur2et3Steps = () => (
  <Fragment>
    <Text>
      <strong>Indicateur concernant les entreprises entre 50 et 250 salariés</strong>
    </Text>
    <FAQStep icon={<IconGrow />} isValid="invalid">
      <Text>
        La notion d'
        <strong>
          augmentation individuelle correspond à une augmentation individuelle du salaire de base du salarié concerné.
        </strong>
      </Text>
    </FAQStep>

    <FAQStep icon={<IconLamp />}>
      <Text>
        La notion d’augmentation individuelle pour le calcul de cet indicateur <strong>inclut</strong> les augmentations
        de salaire liées à une promotion.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconLamp />}>
      <Text>
        L'indicateur est calculé <strong>au niveau de l'entreprise</strong>, et non par groupes de salariés.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconLamp />}>
      <Text>L’indicateur n’est pas calculable&nbsp;:</Text>
      <UnorderedList>
        <ListItem>Si aucune augmentation individuelle n'est intervenue au cours de la période de référence,</ListItem>
        <ListItem>
          Ou si l’effectif pris en compte pour le calcul des indicateurs ne comporte pas au moins 5 femmes et 5 hommes.
        </ListItem>
      </UnorderedList>
    </FAQStep>
  </Fragment>
)

export default FAQIndicateur2et3Steps
