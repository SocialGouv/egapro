import React, { FunctionComponent } from "react"
import { Table, TableCaption, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react"

import { FormState } from "../../globals"
import { displayFractionPercentWithEmptyData, displaySexeSurRepresente } from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

import { getResults } from "../Indicateur2et3/IndicateurDeuxTrois"

interface RecapitulatifIndicateurDeuxTroisProps {
  indicateurDeuxTroisFormValidated: FormState
  effectifsIndicateurDeuxTroisCalculable: boolean
  indicateurDeuxTroisCalculable: boolean
  indicateurEcartAugmentationPromotion: number | undefined
  indicateurEcartNombreEquivalentSalaries: number | undefined
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  noteIndicateurDeuxTrois: number | undefined
  correctionMeasure: boolean
  tauxAugmentationPromotionFemmes: number | undefined
  tauxAugmentationPromotionHommes: number | undefined
  plusPetitNombreSalaries: "hommes" | "femmes" | undefined
}

const RecapitulatifIndicateurDeuxTrois: FunctionComponent<RecapitulatifIndicateurDeuxTroisProps> = ({
  indicateurDeuxTroisFormValidated,
  effectifsIndicateurDeuxTroisCalculable,
  indicateurDeuxTroisCalculable,
  indicateurEcartAugmentationPromotion,
  indicateurEcartNombreEquivalentSalaries,
  indicateurSexeSurRepresente,
  noteIndicateurDeuxTrois,
  correctionMeasure,
  tauxAugmentationPromotionFemmes,
  tauxAugmentationPromotionHommes,
}) => {
  if (indicateurDeuxTroisFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux d'augmentations entre les femmes et les hommes"
        text={
          <>
            Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saisies.{" "}
            <TextSimulatorLink to="/indicateur2et3" label="Valider les données" />
          </>
        }
      />
    )
  }

  if (!effectifsIndicateurDeuxTroisCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux d'augmentations entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car les effectifs comprennent moins de 5 femmes ou moins de 5 hommes."
      />
    )
  }

  if (!indicateurDeuxTroisCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux d'augmentations entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car il n’y a pas eu d'augmentation durant la période de référence"
      />
    )
  }

  const results = getResults(indicateurEcartAugmentationPromotion, indicateurEcartNombreEquivalentSalaries)

  return (
    <div>
      <RecapBloc
        title="Indicateur écart de taux d'augmentations entre les femmes et les hommes"
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
