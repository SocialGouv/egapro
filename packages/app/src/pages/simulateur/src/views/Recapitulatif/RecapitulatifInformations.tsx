import React, { FunctionComponent } from "react"
import { Heading, SimpleGrid } from "@chakra-ui/react"

import { FormState, TrancheEffectifs } from "../../globals"

import InfoBlock from "../../components/ds/InfoBlock"
import { TextSimulatorLink } from "../../components/SimulatorLink"
import FormStack from "../../components/ds/FormStack"
import FakeInputGroup from "../../components/ds/FakeInputGroup"
import { calendarYear, Year } from "../../utils/date"

interface RecapitulatifInformationsProps {
  informationsFormValidated: FormState
  trancheEffectifs: TrancheEffectifs
  anneeDeclaration: number | undefined
  finPeriodeReference: string | undefined
  nombreSalaries: number | undefined
  periodeSuffisante: boolean
}

const RecapitulatifInformations: FunctionComponent<RecapitulatifInformationsProps> = ({
  informationsFormValidated,
  trancheEffectifs,
  anneeDeclaration,
  finPeriodeReference,
  nombreSalaries,
  periodeSuffisante,
}) => {
  if (informationsFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Informations"
        text={
          <>
            Nous ne pouvons pas afficher les informations de votre entreprise car vous n'avez pas encore validé vos
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
      {finPeriodeReference && (
        <div>
          <Heading as="div" size="sm" mb={2}>
            Période de référence
          </Heading>
          <SimpleGrid columns={{ xl: 2 }} spacing={6}>
            <FakeInputGroup label="Date de début">{calendarYear(finPeriodeReference, Year.Subtract, 1)}</FakeInputGroup>
            <FakeInputGroup label="Date de fin">{finPeriodeReference}</FakeInputGroup>
          </SimpleGrid>
        </div>
      )}
      <FakeInputGroup label="Tranche d'effectifs de l'entreprise ou de l'UES">{trancheEffectifs}</FakeInputGroup>
      {periodeSuffisante ? (
        <FakeInputGroup label="Nombre de salariés pris en compte pour le calcul de l'index">
          {nombreSalaries}
        </FakeInputGroup>
      ) : (
        <InfoBlock
          type="warning"
          text="Vous ne disposez pas d'une période de référence de 12 mois consécutifs, vos indicateurs et votre index ne sont pas calculables."
        />
      )}
    </FormStack>
  )
}

export default RecapitulatifInformations
