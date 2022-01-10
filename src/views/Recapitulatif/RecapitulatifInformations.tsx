import React, { FunctionComponent } from "react"
import { Heading, SimpleGrid } from "@chakra-ui/react"

import { FormState, TrancheEffectifs } from "../../globals"
import { calendarYear, Year } from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import { TextSimulatorLink } from "../../components/SimulatorLink"
import FormStack from "../../components/ds/FormStack"
import FakeInputGroup from "../../components/ds/FakeInputGroup"

interface RecapitulatifInformationsProps {
  informationsFormValidated: FormState
  trancheEffectifs: TrancheEffectifs
  anneeDeclaration: number | undefined
  finPeriodeReference: string
  nombreSalaries: number | undefined
}

const RecapitulatifInformations: FunctionComponent<RecapitulatifInformationsProps> = ({
  informationsFormValidated,
  trancheEffectifs,
  anneeDeclaration,
  finPeriodeReference,
  nombreSalaries,
}) => {
  if (informationsFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Informations"
        text={
          <>
            Nous ne pouvons pas afficher les informations de votre entreprise car vous n’avez pas encore validé vos
            données saisies. <TextSimulatorLink to="/informations" label="Valider les données" />
          </>
        }
      />
    )
  }

  return (
    <FormStack>
      <FakeInputGroup label="Année au titre de laquelle les indicateurs sont calculés">
        {anneeDeclaration}
      </FakeInputGroup>
      <div>
        <Heading as="div" size="sm" mb={2}>
          Période de référence
        </Heading>
        <SimpleGrid columns={{ xl: 2 }} spacing={6}>
          <FakeInputGroup label="Date de début">{calendarYear(finPeriodeReference, Year.Subtract, 1)}</FakeInputGroup>
          <FakeInputGroup label="Date de début">{finPeriodeReference}</FakeInputGroup>
        </SimpleGrid>
      </div>
      <FakeInputGroup label="Tranche d'effectifs de l'entreprise ou de l'UES">{trancheEffectifs}</FakeInputGroup>
      <FakeInputGroup label="Nombre de salariés pris en compte pour le calcul de l'index">
        {nombreSalaries}
      </FakeInputGroup>
    </FormStack>
  )
}

export default RecapitulatifInformations
