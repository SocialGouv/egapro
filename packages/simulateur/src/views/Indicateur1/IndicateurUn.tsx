import React, { FunctionComponent, PropsWithChildren } from "react"

import calculIndicateurUn from "../../utils/calculsEgaProIndicateurUn"
import { useTitle } from "../../utils/hooks"

import ActionBar from "../../components/ActionBar"
import FormStack from "../../components/ds/FormStack"
import InfoBlock from "../../components/ds/InfoBlock"
import Page from "../../components/Page"
import { ButtonSimulatorLink, TextSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import IndicateurUnCoef from "./IndicateurUnCoef/IndicateurUnCoef"
import IndicateurUnCsp from "./IndicateurUnCsp/IndicateurUnCsp"
import IndicateurUnTypeForm from "./IndicateurUnTypeForm"

const title = "Indicateur écart de rémunération"

const IndicateurUn: FunctionComponent = () => {
  useTitle(title)

  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const { csp } = state.indicateurUn

  const readOnly = state.indicateurUn.formValidated === "Valid"

  // le formulaire d'effectif n'est pas validé
  if (state.effectif.formValidated !== "Valid") {
    return (
      <PageIndicateurUn>
        <InfoBlock
          type="warning"
          title="Vous devez valider les effectifs pris en compte pour le calcul avant d’accéder à cet indicateur."
          text={<TextSimulatorLink to="/effectifs" label="Valider les effectifs" />}
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
            label="Suivant"
          />
        </ActionBar>
      </PageIndicateurUn>
    )
  }

  return (
    <PageIndicateurUn>
      <IndicateurUnTypeForm readOnly={readOnly} />
      {csp ? <IndicateurUnCsp /> : <IndicateurUnCoef state={state} dispatch={dispatch} />}
    </PageIndicateurUn>
  )
}

const PageIndicateurUn = ({ children }: PropsWithChildren) => (
  <Page
    title={title}
    tagline={[
      "Les rémunérations annuelles moyennes des femmes et des hommes doivent être renseignées par catégorie de postes équivalents (soit par CSP, soit par niveau ou coefficient hiérarchique en application de la classification de branche ou d’une autre méthode de cotation des postes après consultation du CSE) et par tranche d’âge.",
    ]}
  >
    <FormStack>{children}</FormStack>
  </Page>
)

export default IndicateurUn
