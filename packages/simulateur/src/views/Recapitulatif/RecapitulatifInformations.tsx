import { Heading, SimpleGrid } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"

import FakeInputGroup from "../../components/ds/FakeInputGroup"
import FormStack from "../../components/ds/FormStack"
import InfoBlock from "../../components/ds/InfoBlock"
import { TextSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { calendarYear, Year } from "../../utils/date"

interface RecapitulatifInformationsProps {
  nombreSalaries?: number
  periodeSuffisante: boolean
}

const RecapitulatifInformations: FunctionComponent<RecapitulatifInformationsProps> = ({
  nombreSalaries,
  periodeSuffisante,
}) => {
  const { state } = useAppStateContextProvider()

  if (!state) return null

  const {
    formValidated: informationsFormValidated,
    trancheEffectifs,
    anneeDeclaration,
    finPeriodeReference,
  } = state.informations

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
          title={`Index égalité femmes-hommes en ${
            Number(anneeDeclaration) + 1
          } (au titre des données ${anneeDeclaration})`}
          text="Vous ne disposez pas d'une période de référence de 12 mois consécutifs, vos indicateurs et votre index ne sont pas calculables."
        />
      )}
    </FormStack>
  )
}

export default RecapitulatifInformations
