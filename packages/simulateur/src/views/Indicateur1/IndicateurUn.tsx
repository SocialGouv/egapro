import React, { FunctionComponent, PropsWithChildren } from "react"

import calculerIndicateurUn from "../../utils/calculsEgaProIndicateurUn"
import { useTitle } from "../../utils/hooks"

import ActionBar from "../../components/ActionBar"
import ButtonAction from "../../components/ds/ButtonAction"
import FormStack from "../../components/ds/FormStack"
import InfoBlock from "../../components/ds/InfoBlock"
import SimulateurPage from "../../components/SimulateurPage"
import { ButtonSimulatorLink, TextSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFormValid } from "../../utils/formHelpers"
import IndicateurUnCoef from "./IndicateurUnCoef/IndicateurUnCoef"
import IndicateurUnCsp from "./IndicateurUnCsp/IndicateurUnCsp"
import IndicateurUnTypeForm from "./IndicateurUnTypeForm"

const title = "Indicateur écart de rémunération"

const IndicateurUn: FunctionComponent = () => {
  useTitle(title)

  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const { modaliteCalcul } = state.indicateurUn

  const readOnly = isFormValid(state.indicateurUn)

  // le formulaire d'effectif n'est pas validé
  if (!isFormValid(state.effectif)) {
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

  const { effectifsIndicateurCalculable } = calculerIndicateurUn(state)

  const setWriteMode =
    modaliteCalcul === "csp"
      ? () => dispatch({ type: "validateIndicateurUn", valid: "None" })
      : () => dispatch({ type: "validateIndicateurUnCoefEffectif", valid: "None" })

  return (
    <PageIndicateurUn>
      <IndicateurUnTypeForm readOnly={readOnly} />
      {modaliteCalcul === "csp" ? <IndicateurUnCsp /> : <IndicateurUnCoef />}
      {!effectifsIndicateurCalculable && (
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable"
          text="L’ensemble des groupes valables (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs."
        />
      )}
      {isFormValid(state.indicateurUn) && (
        <ActionBar>
          <ButtonSimulatorLink
            to={state.informations.trancheEffectifs === "50 à 250" ? "/indicateur2et3" : "/indicateur2"}
            label="Suivant"
          />
          {isFormValid(state.indicateurUn) && (
            <ButtonAction size="lg" variant="outline" label="Modifier" onClick={setWriteMode} />
          )}
        </ActionBar>
      )}
    </PageIndicateurUn>
  )
}

const PageIndicateurUn = ({ children }: PropsWithChildren) => (
  <SimulateurPage
    title={title}
    tagline={[
      "Les rémunérations annuelles moyennes des femmes et des hommes doivent être renseignées par catégorie de postes équivalents (soit par CSP, soit par niveau ou coefficient hiérarchique en application de la classification de branche ou d’une autre méthode de cotation des postes après consultation du CSE) et par tranche d’âge.",
    ]}
  >
    <FormStack>{children}</FormStack>
  </SimulateurPage>
)

export default IndicateurUn
