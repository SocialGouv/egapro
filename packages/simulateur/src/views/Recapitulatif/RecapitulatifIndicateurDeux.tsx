import { Table, TableCaption, Tbody, Td, Tr } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"

import {
  displayFractionPercentWithEmptyData,
  displayNameCategorieSocioPro,
  displayPercent,
  displaySexeSurRepresente,
} from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import { indicateursInfo } from "../../config"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculerIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux"
import MessageWhenInvalid from "./components/MessageWhenInvalid"
import RecapBloc from "./components/RecapBloc"
import { isFormValid } from "../../utils/formHelpers"

interface RecapitulatifIndicateurDeuxProps {
  calculsIndicateurDeux: ReturnType<typeof calculerIndicateurDeux>
}

const RecapitulatifIndicateurDeux: FunctionComponent<RecapitulatifIndicateurDeuxProps> = ({
  calculsIndicateurDeux,
}) => {
  const { state } = useAppStateContextProvider()

  if (!state) return null

  const indicateurDeuxFormValidated = state.indicateurDeux.formValidated

  const isEffectifsFilled = isFormValid(state.effectif)

  const {
    effectifsIndicateurCalculable,
    indicateurCalculable,
    effectifEtEcartAugmentParGroupe,
    indicateurEcartAugmentation,
    indicateurSexeSurRepresente,
    noteIndicateurDeux,
    correctionMeasure,
  } = calculsIndicateurDeux

  if (!isEffectifsFilled) {
    return <MessageWhenInvalid indicateur="indicateur2" />
  }

  if (!effectifsIndicateurCalculable) {
    return (
      <InfoBlock
        type="warning"
        title={indicateursInfo.indicateur2.title}
        text="Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
      />
    )
  }

  if (!indicateurCalculable) {
    return (
      <InfoBlock
        type="warning"
        title={indicateursInfo.indicateur2.title}
        text="Malheureusement votre indicateur n’est pas calculable car il n’y a pas eu d’augmentation durant la période de référence"
      />
    )
  }

  if (indicateurDeuxFormValidated === "None") {
    return <MessageWhenInvalid indicateur="indicateur2" />
  }

  return (
    <RecapBloc
      indicateur="indicateur2"
      resultSummary={{
        firstLineLabel: "Votre résultat final est",
        firstLineData: indicateurEcartAugmentation !== undefined ? displayPercent(indicateurEcartAugmentation) : "--",
        firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
        secondLineLabel: "Votre note obtenue est",
        secondLineData: (noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") + "/20",
        secondLineInfo: correctionMeasure ? "** mesures de correction prises en compte" : undefined,
        indicateurSexeSurRepresente,
      }}
    >
      <Table size="sm" variant="striped">
        <TableCaption>écart de taux d’augmentations par csp</TableCaption>
        <Tbody>
          {effectifEtEcartAugmentParGroupe.map(({ categorieSocioPro, ecartTauxAugmentation }) => (
            <Tr key={categorieSocioPro}>
              <Td>{displayNameCategorieSocioPro(categorieSocioPro)}</Td>
              <Td isNumeric>{displayFractionPercentWithEmptyData(ecartTauxAugmentation, 1)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </RecapBloc>
  )
}

export default RecapitulatifIndicateurDeux
