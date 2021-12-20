/** @jsx jsx */
import { jsx } from "@emotion/react"
import { ReactNode } from "react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, ActionType } from "../../globals"

import calculIndicateurUn from "../../utils/calculsEgaProIndicateurUn"

import Page from "../../components/Page"
import InfoBlock from "../../components/ds/InfoBlock"
import ActionBar from "../../components/ActionBar"
import { TextSimulatorLink, ButtonSimulatorLink } from "../../components/SimulatorLink"

import IndicateurUnTypeForm from "./IndicateurUnTypeForm"
import IndicateurUnCsp from "./IndicateurUnCsp/IndicateurUnCsp"
import IndicateurUnCoef from "./IndicateurUnCoef/IndicateurUnCoef"
import { useTitle } from "../../utils/hooks"

interface Props extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Indicateur écart de rémunération"

function IndicateurUn({ state, dispatch }: Props) {
  useTitle(title)

  const { csp, coef, autre } = state.indicateurUn
  const readOnly = state.indicateurUn.formValidated === "Valid"

  // le formulaire d'effectif n'est pas validé
  if (state.effectif.formValidated !== "Valid") {
    return (
      <PageIndicateurUn>
        <InfoBlock
          type="warning"
          title="Vous devez renseignez vos effectifs avant d’avoir accès à cet indicateur"
          text={<TextSimulatorLink to="/effectifs" label="Renseigner les effectifs" />}
        />
      </PageIndicateurUn>
    )
  }

  const { effectifsIndicateurCalculable } = calculIndicateurUn(state)

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable && state.indicateurUn.csp) {
    return (
      <PageIndicateurUn>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable"
          text="L’ensemble des groupes valables (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs."
        />
        <ActionBar>
          <ButtonSimulatorLink
            to={state.informations.trancheEffectifs === "50 à 250" ? "/indicateur2et3" : "/indicateur2"}
            label="suivant"
          />
        </ActionBar>
      </PageIndicateurUn>
    )
  }

  return (
    <PageIndicateurUn>
      <IndicateurUnTypeForm csp={csp} coef={coef} autre={autre} readOnly={readOnly} dispatch={dispatch} />
      {csp ? (
        <IndicateurUnCsp state={state} dispatch={dispatch} />
      ) : (
        <IndicateurUnCoef state={state} dispatch={dispatch} />
      )}
    </PageIndicateurUn>
  )
}

function PageIndicateurUn({ children }: { children: ReactNode }) {
  return (
    <Page
      title={title}
      tagline={[
        "Les rémunérations annuelles moyennes des femmes et des hommes doivent être renseignées par catégorie de postes équivalents (soit par CSP, soit par niveau ou coefficient hiérarchique en application de la classification de branche ou d’une autre méthode de cotation des postes après consultation du CSE) et par tranche d’âge.",
      ]}
    >
      {children}
    </Page>
  )
}

export default IndicateurUn
