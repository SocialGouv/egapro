import React, { Fragment } from "react"
import { Text, UnorderedList, ListItem, Link } from "@chakra-ui/react"

import { IconLamp } from "../../../components/ds/Icons"

import FAQStep from "../components/FAQStep"

const FAQResultatSteps = () => (
  <Fragment>
    <FAQStep icon={<IconLamp />}>
      <Text>
        Les entreprises doivent transmettre leurs résultats au Ministère du Travail via le{" "}
        <Link
          href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro"
          isExternal
          textDecoration="underline"
        >
          formulaire en ligne
        </Link>
        . Toutes les informations nécessaires à la transmission se trouvent sur ce récapitulatif.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconLamp />}>
      <Text>
        L'index doit être publié sur le site internet de l'entreprise déclarante ou en l'absence de site internet,
        communiqué aux salariés. Les résultats doivent par ailleurs être communiqués au CSE.
      </Text>
    </FAQStep>
    <FAQStep icon={<IconLamp />}>
      <Text mb={1}>
        Si l’entreprise obtient moins de 75 points, elle devra mettre en oeuvre des mesures de correction lui permettant
        d’atteindre au moins 75 points dans un délai 3 ans.
      </Text>
      <Text mb={1}>Les mesures prises seront définies&nbsp;:</Text>
      <UnorderedList>
        <ListItem>dans le cadre de la négociation relative à l’égalité professionnelle</ListItem>
        <ListItem>
          ou à défaut d’accord, par décision unilatérale de l’employeur et après consultation du comité social et
          économique. Cette décision devra être déposée auprès des services de la Direccte. Elle pourra être intégrée au
          plan d’action devant être établi à défaut d’accord relatif à l’égalité professionnelle.
        </ListItem>
      </UnorderedList>
    </FAQStep>
  </Fragment>
)

export default FAQResultatSteps
