import React, { useCallback, FunctionComponent, PropsWithChildren } from "react"
import { RouteComponentProps } from "react-router-dom"
import { Text } from "@chakra-ui/react"

import { AppState, FormState, ActionType, ActionIndicateurTroisData } from "../../globals"

import calculIndicateurTrois from "../../utils/calculsEgaProIndicateurTrois"
import { messageMesureCorrection } from "../../utils/helpers"
import { useTitle } from "../../utils/hooks"

import InfoBlock from "../../components/ds/InfoBlock"
import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import { ButtonSimulatorLink, TextSimulatorLink } from "../../components/SimulatorLink"

import IndicateurTroisForm from "./IndicateurTroisForm"
import IndicateurTroisResult from "./IndicateurTroisResult"

interface IndicateurTroisProps extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Indicateur écart de taux de promotion"

const IndicateurTrois: FunctionComponent<IndicateurTroisProps> = ({ state, dispatch }) => {
  useTitle(title)

  const updateIndicateurTrois = useCallback(
    (data: ActionIndicateurTroisData) => dispatch({ type: "updateIndicateurTrois", data }),
    [dispatch],
  )

  const validateIndicateurTrois = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurTrois", valid }),
    [dispatch],
  )

  const {
    effectifsIndicateurCalculable,
    effectifEtEcartPromoParGroupe,
    indicateurCalculable,
    indicateurEcartPromotion,
    indicateurSexeSurRepresente,
    noteIndicateurTrois,
    correctionMeasure,
  } = calculIndicateurTrois(state)

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
        <div>
          <InfoBlock
            type="warning"
            title="Malheureusement votre indicateur n’est pas calculable"
            text="L’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
          />
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur4" label="Suivant" />
          </ActionBar>
        </div>
      </PageIndicateurTrois>
    )
  }

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (state.indicateurTrois.formValidated === "Valid" && !indicateurCalculable) {
    return (
      <PageIndicateurTrois>
        <div>
          <InfoBlock
            type="warning"
            title="Malheureusement votre indicateur n’est pas calculable"
            text="Il n’y a pas eu de promotion durant la période de référence."
          />
          <ActionBar>
            <ActionLink onClick={() => validateIndicateurTrois("None")}>Modifier les données saisies</ActionLink>
          </ActionBar>
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur4" label="Suivant" />
          </ActionBar>
        </div>
      </PageIndicateurTrois>
    )
  }

  return (
    <PageIndicateurTrois>
      <LayoutFormAndResult
        childrenForm={
          <div>
            <IndicateurTroisForm
              ecartPromoParCategorieSocioPro={effectifEtEcartPromoParGroupe}
              presencePromotion={state.indicateurTrois.presencePromotion}
              readOnly={state.indicateurTrois.formValidated === "Valid"}
              updateIndicateurTrois={updateIndicateurTrois}
              validateIndicateurTrois={validateIndicateurTrois}
            />
            {state.indicateurTrois.formValidated === "Valid" && correctionMeasure && (
              <Text fontSize="sm" color="gray.500" fontStyle="italic" mt={6}>
                {messageMesureCorrection(indicateurSexeSurRepresente, "de promotions", "15/15")}
              </Text>
            )}
          </div>
        }
        childrenResult={
          state.indicateurTrois.formValidated === "Valid" && (
            <IndicateurTroisResult
              indicateurEcartPromotion={indicateurEcartPromotion}
              indicateurSexeSurRepresente={indicateurSexeSurRepresente}
              noteIndicateurTrois={noteIndicateurTrois}
              correctionMeasure={correctionMeasure}
              validateIndicateurTrois={validateIndicateurTrois}
            />
          )
        }
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
