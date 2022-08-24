import React, { Fragment } from "react"
import { Text, UnorderedList, ListItem } from "@chakra-ui/react"

import { IconLamp, IconText, IconMoney } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"

const FAQIndicateur1Steps = () => (
  <Fragment>
    <FAQStep icon={<IconText>ETP</IconText>}>
      <Text>
        La rémunération doit être reconstituée en <strong>équivalent temps plein</strong> sur toute la durée de la
        période de référence.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconMoney />} isValid="valid">
      <Text>
        <strong>Doivent être pris en compte dans la rémunération&nbsp;:</strong>
      </Text>
      <UnorderedList mt={1}>
        <ListItem>
          les salaires ou traitements ordinaires de base ou minimum et tous les autres avantages et accessoires payés,
          directement ou indirectement, en espèces ou en nature, par l’employeur au salarié en raison de l’emploi de ce
          dernier
        </ListItem>
        <ListItem>
          les "bonus", les commissions sur produits, les primes d’objectif liées aux performances individuelles du
          salarié, variables d’un individu à l’autre pour un même poste
        </ListItem>
        <ListItem>les primes collectives (ex&nbsp;: les primes de transport ou primes de vacances)</ListItem>
        <ListItem>les indemnités de congés payés.</ListItem>
      </UnorderedList>
    </FAQStep>

    <FAQStep icon={<IconMoney />} isValid="invalid">
      <Text>
        <strong>Ne doivent pas être pris en compte dans la rémunération&nbsp;:</strong>
      </Text>
      <UnorderedList mt={1}>
        <ListItem>les indemnités de fin de CDD (notamment la prime de précarité)</ListItem>
        <ListItem>les sommes versées dans le cadre du compte épargne-temps (CET)</ListItem>
        <ListItem>les actions, stock-options, compensations différées en actions </ListItem>
        <ListItem>
          les primes liées à une sujétion particulière qui ne concernent pas la personne du salarié (prime de froid,
          prime de nuit etc.)
        </ListItem>
        <ListItem>les heures supplémentaires et complémentaires</ListItem>
        <ListItem>les indemnités de licenciement</ListItem>
        <ListItem>les indemnités de départ en retraite</ListItem>
        <ListItem>les primes d’ancienneté</ListItem>
        <ListItem>les primes d’intéressement et de participation.</ListItem>
      </UnorderedList>
    </FAQStep>

    <FAQStep icon={<IconLamp />}>
      <Text>
        Les groupes ne comportant pas <strong>au moins 3 femmes et 3 hommes</strong> ne doivent pas être retenus pour le
        calcul.
      </Text>
    </FAQStep>

    <FAQStep icon={<IconLamp />}>
      <Text>
        Si le total des effectifs pouvant être pris en compte est inférieur à 40% des effectifs totaux, l'indicateur et
        l'index ne sont pas calculables.
      </Text>
    </FAQStep>
  </Fragment>
)

export default FAQIndicateur1Steps
