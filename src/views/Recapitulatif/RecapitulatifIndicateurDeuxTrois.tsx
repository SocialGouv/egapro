/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { Fragment } from "react"

import { FormState } from "../../globals"
import { displaySexeSurRepresente } from "../../utils/helpers"

import InfoBloc from "../../components/InfoBloc"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

import RowData, { RowLabels, RowLabelFull } from "./components/RowData"

import { getResults, AdditionalInfo } from "../Indicateur2et3/IndicateurDeuxTrois"

interface Props {
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

function RecapitulatifIndicateurDeuxTrois({
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
}: Props) {
  if (!effectifsIndicateurDeuxTroisCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur écart de taux d'augmentations entre les femmes et les hommes"
          text="Malheureusement votre indicateur n’est pas calculable car les effectifs comprennent moins de 5 femmes ou moins de 5 hommes."
        />
      </div>
    )
  }

  if (indicateurDeuxTroisFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur écart de taux d'augmentations entre les femmes et les hommes"
          text={
            <Fragment>
              <span>
                Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saisies.
              </span>{" "}
              <TextSimulatorLink to="/indicateur2et3" label="valider les données" />
            </Fragment>
          }
        />
      </div>
    )
  }

  if (!indicateurDeuxTroisCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur écart de taux d'augmentations entre les femmes et les hommes"
          text="Malheureusement votre indicateur n’est pas calculable  car il n’y a pas eu d'augmentation durant la période de référence"
        />
      </div>
    )
  }

  const results = getResults(indicateurEcartAugmentationPromotion, indicateurEcartNombreEquivalentSalaries)

  return (
    <div css={styles.container}>
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

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    marginTop: 22,
    marginBottom: 22,
  }),
  message: css({}),
}

export default RecapitulatifIndicateurDeuxTrois
