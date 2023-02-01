import React, { FunctionComponent, PropsWithChildren } from "react"

import { useTitle } from "../../utils/hooks"

import calculerIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre"

import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import InfoBlock from "../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import Page from "../../components/Page"
import { ButtonSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import IndicateurQuatreForm from "./IndicateurQuatreForm"
import IndicateurQuatreResult from "./IndicateurQuatreResult"

const title = "Indicateur retour congé maternité"

const IndicateurQuatre: FunctionComponent = () => {
  useTitle(title)

  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const calculsIndicateurQuatre = calculerIndicateurQuatre(state)

  const { indicateurCalculable } = calculsIndicateurQuatre

  const readOnly = state.indicateurQuatre.formValidated === "Valid"

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (readOnly && !indicateurCalculable) {
    const messageNonCalculable =
      state.indicateurQuatre.presenceCongeMat &&
      state.indicateurQuatre.nombreSalarieesPeriodeAugmentation !== undefined &&
      state.indicateurQuatre.nombreSalarieesPeriodeAugmentation === 0
        ? "Il n’y a pas eu d’augmentations salariales pendant la durée du ou des congés maternité."
        : "Il n’y a pas eu de retour de congé maternité pendant la période de référence."
    return (
      <PageIndicateurQuatre>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable"
          text={messageNonCalculable}
        />
        <ActionBar>
          <ActionLink onClick={() => dispatch({ type: "validateIndicateurQuatre", valid: "None" })}>
            Modifier les données saisies
          </ActionLink>
        </ActionBar>
        <ActionBar>
          <ButtonSimulatorLink to="/indicateur5" label="Suivant" />
        </ActionBar>
      </PageIndicateurQuatre>
    )
  }

  return (
    <PageIndicateurQuatre>
      <LayoutFormAndResult
        form={<IndicateurQuatreForm readOnly={readOnly} />}
        result={readOnly && <IndicateurQuatreResult calculsIndicateurQuatre={calculsIndicateurQuatre} />}
      />
    </PageIndicateurQuatre>
  )
}

const PageIndicateurQuatre = ({ children }: PropsWithChildren) => (
  <Page
    title="Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
    tagline="Renseignez le nombre de salariées en congé maternité durant la période de référence et ayant reçu une augmentation à leur retour."
  >
    {children}
  </Page>
)

export default IndicateurQuatre
