import { Table, TableCaption, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"

import { displayFractionPercentWithEmptyData, displaySexeSurRepresente } from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"

import { indicateursInfo } from "../../config"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import calculerIndicateurDeuxTrois from "../../utils/calculsEgaProIndicateurDeuxTrois"
import { calculerResultats } from "../Indicateur2et3/IndicateurDeuxTrois"
import MessageWhenInvalid from "./components/MessageWhenInvalid"

interface RecapitulatifIndicateurDeuxTroisProps {
  calculsIndicateurDeuxTrois: ReturnType<typeof calculerIndicateurDeuxTrois>
}

const RecapitulatifIndicateurDeuxTrois: FunctionComponent<RecapitulatifIndicateurDeuxTroisProps> = ({
  calculsIndicateurDeuxTrois,
}) => {
  const { state } = useAppStateContextProvider()
  if (!state) return null

  const isEffectifsFilled = state.effectif.formValidated === "Valid"

  const indicateurDeuxTroisFormValidated = state.indicateurDeuxTrois.formValidated

  const {
    effectifsIndicateurCalculable,
    indicateurCalculable,
    indicateurEcartAugmentationPromotion,
    indicateurEcartNombreEquivalentSalaries,
    indicateurSexeSurRepresente,
    noteIndicateurDeuxTrois,
    correctionMeasure,
    tauxAugmentationPromotionHommes,
    tauxAugmentationPromotionFemmes,
  } = calculsIndicateurDeuxTrois

  if (!isEffectifsFilled || indicateurDeuxTroisFormValidated === "None") {
    return <MessageWhenInvalid indicateur="indicateur2et3" />
  }

  if (!effectifsIndicateurCalculable) {
    return (
      <InfoBlock
        type="warning"
        title={indicateursInfo.indicateur2et3.title}
        text="Malheureusement votre indicateur n’est pas calculable car les effectifs comprennent moins de 5 femmes ou moins de 5 hommes."
      />
    )
  }

  if (!indicateurCalculable) {
    return (
      <InfoBlock
        type="warning"
        title={indicateursInfo.indicateur2et3.title}
        text="Malheureusement votre indicateur n’est pas calculable car il n’y a pas eu d'augmentation durant la période de référence"
      />
    )
  }

  const results = calculerResultats(indicateurEcartAugmentationPromotion, indicateurEcartNombreEquivalentSalaries)

  return (
    <div>
      <RecapBloc
        indicateur="indicateur2et3"
        resultSummary={{
          firstLineLabel: results.best.label,
          firstLineData: results.best.result,
          firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
          secondLineLabel: "votre note obtenue est",
          secondLineData: (noteIndicateurDeuxTrois !== undefined ? noteIndicateurDeuxTrois : "--") + "/35",
          secondLineInfo: correctionMeasure ? "** mesures de correction prises en compte" : undefined,
          indicateurSexeSurRepresente,
        }}
      >
        <Table size="sm" variant="striped">
          <TableCaption>taux d'augmentation</TableCaption>
          <Thead textTransform="inherit" fontSize=".5rem">
            <Tr>
              <Th />
              <Th fontSize="xxs">Femmes</Th>
              <Th fontSize="xxs">Hommes</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>taux de salariés augmentés</Td>
              <Td isNumeric>{displayFractionPercentWithEmptyData(tauxAugmentationPromotionFemmes, 1)}</Td>
              <Td isNumeric>{displayFractionPercentWithEmptyData(tauxAugmentationPromotionHommes, 1)}</Td>
            </Tr>
          </Tbody>
        </Table>
      </RecapBloc>
    </div>
  )
}

export default RecapitulatifIndicateurDeuxTrois
