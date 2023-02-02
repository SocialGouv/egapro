import React, { FunctionComponent, PropsWithChildren } from "react"

import calculerIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"
import { useTitle } from "../../utils/hooks"

import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import InfoBlock from "../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import { ButtonSimulatorLink, TextSimulatorLink } from "../../components/SimulatorLink"

import SimulateurPage from "../../components/SimulateurPage"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFormValid } from "../../utils/formHelpers"
import IndicateurTroisForm from "./IndicateurTroisForm"
import IndicateurTroisResult from "./IndicateurTroisResult"
import { isFrozenDeclaration } from "../../utils/isFrozenDeclaration"
import { frozenDeclarationMessage } from "../../components/MessageForFrozenDeclaration"

const title = "Indicateur écart de taux de promotion"

const IndicateurTrois: FunctionComponent = () => {
  useTitle(title)

  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const calculsIndicateurTrois = calculerIndicateurTrois(state)

  const frozenDeclaration = isFrozenDeclaration(state)

  const { effectifsIndicateurCalculable, indicateurCalculable } = calculsIndicateurTrois

  const readOnly = isFormValid(state.indicateurTrois)

  // le formulaire d'effectif n'est pas validé
  if (!isFormValid(state.effectif)) {
    return (
      <PageIndicateurTrois>
        <InfoBlock
          type="warning"
          title="Vous devez valider les effectifs pris en compte pour le calcul avant d’accéder à cet indicateur."
          text={<TextSimulatorLink to="/effectifs" label="Valider les effectifs" />}
        />
      </PageIndicateurTrois>
    )
  }

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable) {
    return (
      <PageIndicateurTrois>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable"
          text="L’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
        />
        <ActionBar>
          <ButtonSimulatorLink to="/indicateur4" label="Suivant" />
        </ActionBar>
      </PageIndicateurTrois>
    )
  }

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (readOnly && !indicateurCalculable) {
    return (
      <PageIndicateurTrois>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable"
          text="Il n’y a pas eu de promotion durant la période de référence."
        />
        <ActionBar>
          <ActionLink
            onClick={() => dispatch({ type: "validateIndicateurTrois", valid: "None" })}
            disabled={frozenDeclaration}
            title={frozenDeclaration ? frozenDeclarationMessage : ""}
          >
            Modifier les données saisies
          </ActionLink>
        </ActionBar>
        <ActionBar>
          <ButtonSimulatorLink to="/indicateur4" label="Suivant" />
        </ActionBar>
      </PageIndicateurTrois>
    )
  }

  return (
    <PageIndicateurTrois>
      <LayoutFormAndResult
        form={<IndicateurTroisForm calculsIndicateurTrois={calculsIndicateurTrois} />}
        result={<IndicateurTroisResult calculsIndicateurTrois={calculsIndicateurTrois} />}
      />
    </PageIndicateurTrois>
  )
}

const PageIndicateurTrois = ({ children }: PropsWithChildren) => {
  return (
    <SimulateurPage
      title={title}
      tagline="Le pourcentage de femmes et d’hommes ayant été promus durant la période de référence, doit être renseigné par CSP."
    >
      {children}
    </SimulateurPage>
  )
}

export default IndicateurTrois
