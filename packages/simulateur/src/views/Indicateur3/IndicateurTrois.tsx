import { Text } from "@chakra-ui/react"
import React, { FunctionComponent, PropsWithChildren } from "react"

import { FormState } from "../../globals"

import calculerIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"
import { messageMesureCorrection } from "../../utils/helpers"
import { useTitle } from "../../utils/hooks"

import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import InfoBlock from "../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import Page from "../../components/Page"
import { ButtonSimulatorLink, TextSimulatorLink } from "../../components/SimulatorLink"

import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import IndicateurTroisForm from "./IndicateurTroisForm"
import IndicateurTroisResult from "./IndicateurTroisResult"

const title = "Indicateur écart de taux de promotion"

const IndicateurTrois: FunctionComponent = () => {
  useTitle(title)

  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const calculsIndicateurTrois = calculerIndicateurTrois(state)

  const {
    effectifsIndicateurCalculable,
    effectifEtEcartPromoParGroupe,
    indicateurCalculable,
    indicateurSexeSurRepresente,
    correctionMeasure,
  } = calculsIndicateurTrois

  const readOnly = state.indicateurTrois.formValidated === "Valid"

  // le formulaire d'effectif n'est pas validé
  if (state.effectif.formValidated !== "Valid") {
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
  if (state.indicateurTrois.formValidated === "Valid" && !indicateurCalculable) {
    return (
      <PageIndicateurTrois>
        <InfoBlock
          type="warning"
          title="Malheureusement votre indicateur n’est pas calculable"
          text="Il n’y a pas eu de promotion durant la période de référence."
        />
        <ActionBar>
          <ActionLink onClick={() => dispatch({ type: "validateIndicateurTrois", valid: "None" })}>
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
        childrenForm={
          <>
            <IndicateurTroisForm ecartPromoParCategorieSocioPro={effectifEtEcartPromoParGroupe} readOnly={readOnly} />
            {readOnly && correctionMeasure && (
              <Text fontSize="sm" color="gray.500" fontStyle="italic" mt={6}>
                {messageMesureCorrection(indicateurSexeSurRepresente, "de promotions", "15/15")}
              </Text>
            )}
          </>
        }
        childrenResult={readOnly && <IndicateurTroisResult calculsIndicateurTrois={calculsIndicateurTrois} />}
      />
    </PageIndicateurTrois>
  )
}

const PageIndicateurTrois = ({ children }: PropsWithChildren) => {
  return (
    <Page
      title={title}
      tagline="Le pourcentage de femmes et d’hommes ayant été promus durant la période de référence, doit être renseigné par CSP."
    >
      {children}
    </Page>
  )
}

export default IndicateurTrois
