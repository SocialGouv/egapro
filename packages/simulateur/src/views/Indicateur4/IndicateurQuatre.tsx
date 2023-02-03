import React, { FunctionComponent, PropsWithChildren } from "react"

import { useTitle } from "../../utils/hooks"

import calculerIndicateurQuatre from "../../utils/calculsEgaProIndicateurQuatre"

import { ActionBarSingleForm } from "../../components/ActionBarSingleForm"
import InfoBlock from "../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import SimulateurPage from "../../components/SimulateurPage"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFormValid } from "../../utils/formHelpers"
import { isFrozenDeclaration } from "../../utils/isFrozenDeclaration"
import IndicateurQuatreForm from "./IndicateurQuatreForm"
import IndicateurQuatreResult from "./IndicateurQuatreResult"

const title = "Indicateur retour congé maternité"

const IndicateurQuatre: FunctionComponent = () => {
  useTitle(title)

  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const calculsIndicateurQuatre = calculerIndicateurQuatre(state)

  const frozenDeclaration = isFrozenDeclaration(state)

  const { indicateurCalculable, messageNonCalculable } = calculsIndicateurQuatre

  const readOnly = isFormValid(state.indicateurQuatre)

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (readOnly && !indicateurCalculable) {
    return (
      <PageIndicateurQuatre>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable"
          text={messageNonCalculable}
        />

        <ActionBarSingleForm
          readOnly={readOnly}
          frozenDeclaration={frozenDeclaration}
          to="/indicateur5"
          onClick={() => dispatch({ type: "validateIndicateurQuatre", valid: "None" })}
        />
      </PageIndicateurQuatre>
    )
  }

  return (
    <PageIndicateurQuatre>
      <LayoutFormAndResult
        form={<IndicateurQuatreForm />}
        result={<IndicateurQuatreResult calculsIndicateurQuatre={calculsIndicateurQuatre} />}
      />
    </PageIndicateurQuatre>
  )
}

const PageIndicateurQuatre = ({ children }: PropsWithChildren) => (
  <SimulateurPage
    title="Indicateur pourcentage de salariées augmentées dans l'année suivant leur retour de congé maternité"
    tagline="Renseignez le nombre de salariées en congé maternité durant la période de référence et ayant reçu une augmentation à leur retour."
  >
    {children}
  </SimulateurPage>
)

export default IndicateurQuatre
