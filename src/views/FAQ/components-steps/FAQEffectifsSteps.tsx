import React, { Fragment } from "react"
import { Text, UnorderedList, ListItem } from "@chakra-ui/react"

import { IconLamp, IconText, IconPeople } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"

const FAQEffectifsSteps = () => (
  <Fragment>
    <FAQStep icon={<IconText>CSP</IconText>}>
      <Text>
        L’effectif de l’entreprise est apprécié en effectif physique sur la période de référence. Il doit être renseigné
        par <strong>catégories socio-professionnelles.</strong>
      </Text>
    </FAQStep>

    <FAQStep icon={<IconLamp />}>
      <Text>
        Les caractéristiques individuelles (âge, catégorie de poste) sont appréciées au dernier jour de la période de
        référence ou dernier jour de présence du salarié dans l’entreprise.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconPeople />} isValid="invalid">
      <Text>
        <strong>Ne sont pas pris en compte dans les effectifs&nbsp;:</strong>
      </Text>
      <UnorderedList mt={1}>
        <ListItem>les apprentis et les contrats de professionnalisation</ListItem>
        <ListItem>
          les salariés mis à la disposition de l'entreprise par une entreprise extérieure (dont les intérimaires)
        </ListItem>
        <ListItem>les expatriés</ListItem>
        <ListItem>les salariés en pré-retraite</ListItem>
        <ListItem>
          les salariés absents plus de 6 mois sur la période de référence (arrêt maladie, congés sans solde, cdd
          &lt;6mois etc.).
        </ListItem>
      </UnorderedList>
    </FAQStep>
  </Fragment>
)

export default FAQEffectifsSteps
