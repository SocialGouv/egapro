import React, { FunctionComponent } from "react"

import { FormState, CategorieSocioPro } from "../../globals"

import { displayNameCategorieSocioPro, displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

import { RowDataFull, RowLabelFull } from "./components/RowData"

interface RecapitulatifIndicateurDeuxProps {
  indicateurDeuxFormValidated: FormState
  effectifsIndicateurDeuxCalculable: boolean
  indicateurDeuxCalculable: boolean
  effectifEtEcartAugmentParGroupe: Array<{
    categorieSocioPro: CategorieSocioPro
    ecartTauxAugmentation: number | undefined
  }>
  indicateurEcartAugmentation: number | undefined
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  noteIndicateurDeux: number | undefined
  correctionMeasure: boolean
}

const RecapitulatifIndicateurDeux: FunctionComponent<RecapitulatifIndicateurDeuxProps> = ({
  indicateurDeuxFormValidated,
  effectifsIndicateurDeuxCalculable,
  indicateurDeuxCalculable,
  effectifEtEcartAugmentParGroupe,
  indicateurEcartAugmentation,
  indicateurSexeSurRepresente,
  noteIndicateurDeux,
  correctionMeasure,
}) => {
  if (!effectifsIndicateurDeuxCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
      />
    )
  }

  if (indicateurDeuxFormValidated !== "Valid") {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
        text={
          <>
            Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saisies.{" "}
            <TextSimulatorLink to="/indicateur2" label="valider les données" />
          </>
        }
      />
    )
  }

  if (!indicateurDeuxCalculable) {
    return (
      <InfoBlock
        type="warning"
        title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
        text="Malheureusement votre indicateur n’est pas calculable car il n’y a pas eu d’augmentation durant la période de référence"
      />
    )
  }

  return (
    <RecapBloc
      title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
      resultBubble={{
        firstLineLabel: "votre résultat final est",
        firstLineData: indicateurEcartAugmentation !== undefined ? displayPercent(indicateurEcartAugmentation) : "--",
        firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
        secondLineLabel: "votre note obtenue est",
        secondLineData: (noteIndicateurDeux !== undefined ? noteIndicateurDeux : "--") + "/20",
        secondLineInfo: correctionMeasure ? "** mesures de correction prises en compte" : undefined,
        indicateurSexeSurRepresente,
      }}
    >
      <RowLabelFull label="écart de taux d’augmentations par csp" />

      {effectifEtEcartAugmentParGroupe.map(({ categorieSocioPro, ecartTauxAugmentation }) => (
        <RowDataFull
          key={categorieSocioPro}
          name={displayNameCategorieSocioPro(categorieSocioPro)}
          data={ecartTauxAugmentation}
          asPercent={true}
        />
      ))}
    </RecapBloc>
  )
}

export default RecapitulatifIndicateurDeux
