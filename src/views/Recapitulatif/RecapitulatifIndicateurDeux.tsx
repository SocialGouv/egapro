/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { Fragment } from "react"

import { FormState, CategorieSocioPro } from "../../globals"

import { displayNameCategorieSocioPro, displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import InfoBloc from "../../components/ds/InfoBloc"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

import { RowDataFull, RowLabelFull } from "./components/RowData"

interface Props {
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

function RecapitulatifIndicateurDeux({
  indicateurDeuxFormValidated,
  effectifsIndicateurDeuxCalculable,
  indicateurDeuxCalculable,
  effectifEtEcartAugmentParGroupe,
  indicateurEcartAugmentation,
  indicateurSexeSurRepresente,
  noteIndicateurDeux,
  correctionMeasure,
}: Props) {
  if (!effectifsIndicateurDeuxCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          type="warning"
          title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
          text="Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
        />
      </div>
    )
  }

  if (indicateurDeuxFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          type="warning"
          title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
          text={
            <Fragment>
              Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saisies.{" "}
              <TextSimulatorLink to="/indicateur2" label="valider les données" />
            </Fragment>
          }
        />
      </div>
    )
  }

  if (!indicateurDeuxCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          type="warning"
          title="Indicateur écart de taux d’augmentations entre les femmes et les hommes"
          text="Malheureusement votre indicateur n’est pas calculable car il n’y a pas eu d’augmentation durant la période de référence"
        />
      </div>
    )
  }

  return (
    <div css={styles.container}>
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
}

export default RecapitulatifIndicateurDeux
