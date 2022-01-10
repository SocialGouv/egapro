import React, { FunctionComponent } from "react"

import { FormState } from "../../globals"
import { displaySexeSurRepresente } from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

import RowData, { RowLabels, RowLabelFull } from "./components/RowData"

import { getResults, AdditionalInfo } from "../Indicateur2et3/IndicateurDeuxTrois"

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
  plusPetitNombreSalaries,
}) => {
  if (!effectifsIndicateurDeuxTroisCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux d'augmentations entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car les effectifs comprennent moins de 5 femmes ou moins de 5 hommes."
      />
    )
  }

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
        resultBubble={{
          firstLineLabel: results.best.label,
          firstLineData: results.best.result,
          firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
          secondLineLabel: "votre note obtenue est",
          secondLineData: (noteIndicateurDeuxTrois !== undefined ? noteIndicateurDeuxTrois : "--") + "/35",
          secondLineInfo: correctionMeasure ? "** mesures de correction prises en compte" : undefined,
          indicateurSexeSurRepresente,
        }}
      >
        <RowLabelFull label="taux d'augmentation" />
        <RowLabels labels={["femmes", "hommes"]} />
        <RowData
          name="taux de salariés augmentés"
          data={[tauxAugmentationPromotionFemmes, tauxAugmentationPromotionHommes]}
          asPercent={true}
        />
      </RecapBloc>
      <AdditionalInfo
        results={results}
        indicateurSexeSurRepresente={indicateurSexeSurRepresente}
        plusPetitNombreSalaries={plusPetitNombreSalaries}
        correctionMeasure={correctionMeasure}
      />
    </div>
  )
}

export default RecapitulatifIndicateurDeuxTrois
