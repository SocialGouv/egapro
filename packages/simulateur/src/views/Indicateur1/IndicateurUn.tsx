import React, { FunctionComponent, PropsWithChildren } from "react"

import { useTitle } from "../../utils/hooks"

import FormStack from "../../components/ds/FormStack"
import InfoBlock from "../../components/ds/InfoBlock"
import SimulateurPage from "../../components/SimulateurPage"
import { TextSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFormValid } from "../../utils/formHelpers"
import IndicateurUnCoef from "./IndicateurUnCoef/IndicateurUnCoef"
import IndicateurUnCsp from "./IndicateurUnCsp/IndicateurUnCsp"
import IndicateurUnModaliteCalculForm from "./IndicateurUnModaliteCalculForm"

const title = "Indicateur écart de rémunération"

const IndicateurUn: FunctionComponent = () => {
  useTitle(title)

  const { state } = useAppStateContextProvider()

  if (!state) return null

  const { modaliteCalcul, modaliteCalculformValidated } = state.indicateurUn

  const readOnly = state.indicateurUn.modaliteCalculformValidated === "Valid"

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

  return (
    <PageIndicateurUn>
      <IndicateurUnModaliteCalculForm readOnly={readOnly} />
      {modaliteCalculformValidated === "Valid" && <IndicateurUnModeCalculValide modaliteCalcul={modaliteCalcul} />}
    </PageIndicateurUn>
  )
}

const IndicateurUnModeCalculValide = ({ modaliteCalcul }: any) => {
  if (!modaliteCalcul) return null

  if (modaliteCalcul === "csp") return <IndicateurUnCsp />

  return <IndicateurUnCoef />
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
