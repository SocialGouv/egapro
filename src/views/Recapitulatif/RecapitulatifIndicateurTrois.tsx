/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { Fragment } from "react"

import { FormState, CategorieSocioPro } from "../../globals"

import { displayNameCategorieSocioPro, displayPercent, displaySexeSurRepresente } from "../../utils/helpers"

import InfoBloc from "../../components/InfoBloc"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

import { RowDataFull, RowLabelFull } from "./components/RowData"

interface Props {
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

function RecapitulatifIndicateurTrois({
  indicateurTroisFormValidated,
  effectifsIndicateurTroisCalculable,
  indicateurTroisCalculable,
  effectifEtEcartPromoParGroupe,
  indicateurEcartPromotion,
  indicateurSexeSurRepresente,
  noteIndicateurTrois,
  correctionMeasure,
}: Props) {
  if (!effectifsIndicateurTroisCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur écart de taux de promotions entre les femmes et les hommes"
          text="Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
        />
      </div>
    )
  }

  if (indicateurTroisFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur écart de taux de promotions entre les femmes et les hommes"
          text={
            <Fragment>
              <span>
                Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saissies.
              </span>{" "}
              <TextSimulatorLink to="/indicateur3" label="valider les données" />
            </Fragment>
          }
        />
      </div>
    )
  }

  if (!indicateurTroisCalculable) {
    return (
      <div css={styles.container}>
        <InfoBloc
          title="Indicateur écart de taux de promotions entre les femmes et les hommes"
          text="Malheureusement votre indicateur n’est pas calculable  car il n’y a pas eu de promotion durant la période de référence"
        />
      </div>
    )
  }

  return (
    <div css={styles.container}>
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

export default RecapitulatifIndicateurTrois
