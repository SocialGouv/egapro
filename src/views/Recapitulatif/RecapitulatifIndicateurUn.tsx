/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { Fragment } from "react"

import { FormState, TranchesAges } from "../../globals"
import { effectifEtEcartRemuGroupCsp, effectifEtEcartRemuGroupCoef } from "../../utils/calculsEgaProIndicateurUn"

import {
  displayNameTranchesAges,
  displayNameCategorieSocioPro,
  displayPercent,
  displaySexeSurRepresente,
} from "../../utils/helpers"

import InfoBlock from "../../components/ds/InfoBlock"
import RecapBloc from "./components/RecapBloc"
import { TextSimulatorLink } from "../../components/SimulatorLink"

import RowData, { RowLabels, RowLabelFull } from "./components/RowData"

interface Props {
  indicateurUnFormValidated: FormState
  effectifsIndicateurUnCalculable: boolean
  effectifEtEcartRemuParTranche: Array<effectifEtEcartRemuGroupCsp> | Array<effectifEtEcartRemuGroupCoef>
  indicateurEcartRemuneration: number | undefined
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined
  indicateurUnParCSP: boolean
  noteIndicateurUn: number | undefined
}

function RecapitulatifIndicateurUn({
  indicateurUnFormValidated,
  effectifsIndicateurUnCalculable,
  effectifEtEcartRemuParTranche,
  indicateurEcartRemuneration,
  indicateurSexeSurRepresente,
  indicateurUnParCSP,
  noteIndicateurUn,
}: Props) {
  if (!effectifsIndicateurUnCalculable) {
    const messageCalculParCSP = indicateurUnParCSP ? (
      ""
    ) : (
      <TextSimulatorLink to="/indicateur1" label="Vous devez calculer par CSP" />
    )
    return (
      <div css={styles.container}>
        <InfoBlock
          type="warning"
          title="Indicateur écart de rémunération entre les femmes et les hommes"
          text={`Malheureusement votre indicateur n’est pas calculable car l’ensemble des groupes valables (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs. ${messageCalculParCSP}`}
        />
      </div>
    )
  }

  if (indicateurUnFormValidated !== "Valid") {
    return (
      <div css={styles.container}>
        <InfoBlock
          type="warning"
          title="Indicateur écart de rémunération entre les femmes et les hommes"
          text={
            <Fragment>
              Nous ne pouvons pas calculer votre indicateur car vous n’avez pas encore validé vos données saisies.{" "}
              <TextSimulatorLink to="/indicateur1" label="Valider les données" />
            </Fragment>
          }
        />
      </div>
    )
  }

  // @ts-ignore
  const groupEffectifEtEcartRemuParTranche = effectifEtEcartRemuParTranche.reduce(
    // @ts-ignore
    (acc, el, index) => {
      const newEl =
        el.categorieSocioPro !== undefined
          ? {
              id: el.categorieSocioPro,
              name: displayNameCategorieSocioPro(el.categorieSocioPro),
              ...el,
            }
          : el
      if (index % 4 === 0) {
        acc.push([newEl])
      } else {
        acc[acc.length - 1].push(newEl)
      }
      return acc
    },
    [],
  )

  return (
    <div css={styles.container}>
      <RecapBloc
        title="Indicateur écart de rémunération entre les femmes et les hommes"
        resultBubble={{
          firstLineLabel: "votre résultat final est",
          firstLineData: indicateurEcartRemuneration !== undefined ? displayPercent(indicateurEcartRemuneration) : "--",
          firstLineInfo: displaySexeSurRepresente(indicateurSexeSurRepresente),
          secondLineLabel: "votre note obtenue est",
          secondLineData: (noteIndicateurUn !== undefined ? noteIndicateurUn : "--") + "/40",
          indicateurSexeSurRepresente,
        }}
      >
        <RowLabelFull
          label={
            <Fragment>
              écart de rémunération par {indicateurUnParCSP ? "csp" : "niveau ou coefficient hiérarchique"}
              <br />
              (avant seuil de pertinence)
            </Fragment>
          }
        />
        <RowLabels
          labels={[
            displayNameTranchesAges(TranchesAges.MoinsDe30ans),
            displayNameTranchesAges(TranchesAges.De30a39ans),
            displayNameTranchesAges(TranchesAges.De40a49ans),
            displayNameTranchesAges(TranchesAges.PlusDe50ans),
          ]}
        />

        {groupEffectifEtEcartRemuParTranche.map(
          (
            effectifEtEcartRemuParTranche: Array<{
              id: any
              name: string
              ecartRemunerationMoyenne: number | undefined
            }>,
          ) => (
            <RowData
              key={effectifEtEcartRemuParTranche[0].id}
              name={effectifEtEcartRemuParTranche[0].name}
              data={[
                effectifEtEcartRemuParTranche[0].ecartRemunerationMoyenne,
                effectifEtEcartRemuParTranche[1].ecartRemunerationMoyenne,
                effectifEtEcartRemuParTranche[2].ecartRemunerationMoyenne,
                effectifEtEcartRemuParTranche[3].ecartRemunerationMoyenne,
              ]}
              asPercent={true}
            />
          ),
        )}
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

export default RecapitulatifIndicateurUn
