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
import calculerIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"
import MessageWhenInvalid from "./components/MessageWhenInvalid"
import RecapBloc from "./components/RecapBloc"
import { isFormValid } from "../../utils/formHelpers"

interface RecapitulatifIndicateurTroisProps {
  calculsIndicateurTrois: ReturnType<typeof calculerIndicateurTrois>
}

const RecapitulatifIndicateurTrois: FunctionComponent<RecapitulatifIndicateurTroisProps> = ({
  calculsIndicateurTrois,
}) => {
  const { state } = useAppStateContextProvider()

  if (!state) return null

  const isEffectifsFilled = isFormValid(state.effectif)
  const indicateurTroisFormValidated = state.indicateurTrois.formValidated

  const {
    effectifsIndicateurCalculable,
    indicateurCalculable,
    effectifEtEcartPromoParGroupe,
    indicateurEcartPromotion,
    indicateurSexeSurRepresente,
    noteIndicateurTrois,
    correctionMeasure,
  } = calculsIndicateurTrois

  if (!isEffectifsFilled) {
    return <MessageWhenInvalid indicateur="indicateur3" />
  }

  if (!effectifsIndicateurCalculable) {
    return (
      <InfoBlock
        type="warning"
        title={indicateursInfo.indicateur3.title}
        text="Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
      />
    )
  }

  if (!indicateurCalculable) {
    return (
      <InfoBlock
        type="warning"
        title={indicateursInfo.indicateur3.title}
        text="Malheureusement votre indicateur n’est pas calculable car il n’y a pas eu de promotion durant la période de référence"
      />
    )
  }

  if (indicateurTroisFormValidated === "None") {
    return <MessageWhenInvalid indicateur="indicateur3" />
  }

  return (
    <RecapBloc
      indicateur="indicateur3"
      resultSummary={{
        firstLineLabel: "votre résultat final est",
        firstLineData: indicateurEcartPromotion !== undefined ? displayPercent(indicateurEcartPromotion) : "--",
        firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
        secondLineLabel: "votre note obtenue est",
        secondLineData: (noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") + "/15",
        secondLineInfo: correctionMeasure ? "** mesures de correction prises en compte" : undefined,
        indicateurSexeSurRepresente,
      }}
    >
      <Table size="sm" variant="striped">
        <TableCaption>écart de taux d’augmentations par csp</TableCaption>
        <Tbody>
          {effectifEtEcartPromoParGroupe.map(({ categorieSocioPro, ecartTauxPromotion }) => (
            <Tr key={categorieSocioPro}>
              <Td>{displayNameCategorieSocioPro(categorieSocioPro)}</Td>
              <Td isNumeric>{displayFractionPercentWithEmptyData(ecartTauxPromotion, 1)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </RecapBloc>
  )
}

export default RecapitulatifIndicateurTrois
