import React, { FunctionComponent } from "react"

import { FormState, CategorieSocioPro } from "../../globals"

import { displayNameCategorieSocioPro, displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

import { RowDataFull, RowLabelFull } from "./components/RowData"

interface RecapitulatifIndicateurTroisProps {
  indicateurTroisFormValidated: FormState
  effectifsIndicateurTroisCalculable: boolean
  indicateurTroisCalculable: boolean
  effectifEtEcartPromoParGroupe: Array<{
    categorieSocioPro: CategorieSocioPro
    ecartTauxPromotion: number | undefined
  }>
  indicateurEcartPromotion: number | undefined
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  noteIndicateurTrois: number | undefined
  correctionMeasure: boolean
}

const RecapitulatifIndicateurTrois: FunctionComponent<RecapitulatifIndicateurTroisProps> = ({
  indicateurTroisFormValidated,
  effectifsIndicateurTroisCalculable,
  indicateurTroisCalculable,
  effectifEtEcartPromoParGroupe,
  indicateurEcartPromotion,
  indicateurSexeSurRepresente,
  noteIndicateurTrois,
  correctionMeasure,
}) => {
  if (!effectifsIndicateurTroisCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux de promotions entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
      />
    )
  }

  if (indicateurTroisFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux de promotions entre les femmes et les hommes"
        text={
          <>
            Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saisies.{" "}
            <TextSimulatorLink to="/indicateur3" label="valider les données" />
          </>
        }
      />
    )
  }

  if (!indicateurTroisCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux de promotions entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car il n’y a pas eu de promotion durant la période de référence"
      />
    )
  }

  return (
    <RecapBloc
      title="Indicateur écart de taux de promotions entre les femmes et les hommes"
      resultBubble={{
        firstLineLabel: "votre résultat final est",
        firstLineData: indicateurEcartPromotion !== undefined ? displayPercent(indicateurEcartPromotion) : "--",
        firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
        secondLineLabel: "votre note obtenue est",
        secondLineData: (noteIndicateurTrois !== undefined ? noteIndicateurTrois : "--") + "/15",
        secondLineInfo: correctionMeasure ? "** mesures de correction prises en compte" : undefined,
        indicateurSexeSurRepresente,
      }}
    >
      <RowLabelFull label="écart de taux de promotions par csp" />

      {effectifEtEcartPromoParGroupe.map(({ categorieSocioPro, ecartTauxPromotion }) => (
        <RowDataFull
          key={categorieSocioPro}
          name={displayNameCategorieSocioPro(categorieSocioPro)}
          data={ecartTauxPromotion}
          asPercent={true}
        />
      ))}
    </RecapBloc>
  )
}

export default RecapitulatifIndicateurTrois
