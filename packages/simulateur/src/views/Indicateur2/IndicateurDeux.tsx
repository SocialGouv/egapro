import React, { FunctionComponent, PropsWithChildren } from "react"

import calculerIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux"
import { useTitle } from "../../utils/hooks"

import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import InfoBlock from "../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import { ButtonSimulatorLink, TextSimulatorLink } from "../../components/SimulatorLink"

import { frozenDeclarationMessage, MessageForFrozenDeclaration } from "../../components/MessageForFrozenDeclaration"
import SimulateurPage from "../../components/SimulateurPage"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFormValid } from "../../utils/formHelpers"
import IndicateurDeuxForm from "./IndicateurDeuxForm"
import IndicateurDeuxResult from "./IndicateurDeuxResult"
import { isFrozenDeclaration } from "../../utils/isFrozenDeclaration"

const title = "Indicateur écart de taux d’augmentation individuelle hors promotion"

const IndicateurDeux: FunctionComponent = () => {
  useTitle(title)

  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const calculsIndicateurDeux = calculerIndicateurDeux(state)

  const frozenDeclaration = isFrozenDeclaration(state)

  const { effectifsIndicateurCalculable, indicateurCalculable } = calculsIndicateurDeux

  // le formulaire d'effectif n'est pas validé
  if (!isFormValid(state.effectif)) {
    return (
      <PageIndicateurDeux>
        <InfoBlock
          type="warning"
          title="Vous devez valider les effectifs pris en compte pour le calcul avant d’accéder à cet indicateur."
          text={<TextSimulatorLink to="/effectifs" label="Valider les effectifs" />}
        />
      </PageIndicateurDeux>
    )
  }

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable) {
    return (
      <PageIndicateurDeux>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable"
          text="L’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
        />
        <ActionBar>
          <ButtonSimulatorLink to="/indicateur3" label="Suivant" />
        </ActionBar>
      </PageIndicateurDeux>
    )
  }

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (isFormValid(state.indicateurDeux) && !indicateurCalculable) {
    return (
      <PageIndicateurDeux>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable"
          text="Il n’y a pas eu d’augmentation individuelle durant la période de référence."
        />
        <ActionBar>
          <ActionLink
            onClick={() => dispatch({ type: "validateIndicateurDeux", valid: "None" })}
            disabled={frozenDeclaration}
            title={frozenDeclaration ? frozenDeclarationMessage : ""}
          >
            Modifier les données saisies
          </ActionLink>
        </ActionBar>
        <ActionBar>
          <ButtonSimulatorLink to="/indicateur3" label="Suivant" />
        </ActionBar>
      </PageIndicateurDeux>
    )
  }

  return (
    <PageIndicateurDeux>
      <MessageForFrozenDeclaration />

      <LayoutFormAndResult
        form={<IndicateurDeuxForm calculsIndicateurDeux={calculsIndicateurDeux} />}
        result={<IndicateurDeuxResult calculsIndicateurDeux={calculsIndicateurDeux} />}
      />
    </PageIndicateurDeux>
  )
}

const PageIndicateurDeux = ({ children }: PropsWithChildren) => (
  <SimulateurPage
    title={title}
    tagline="Le pourcentage de femmes et d’hommes ayant été augmentés durant la période de référence, doit être renseigné par CSP."
  >
    {children}
  </SimulateurPage>
)

export default IndicateurDeux
