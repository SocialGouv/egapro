import React, { useCallback, FunctionComponent, PropsWithChildren } from "react"
import { Text } from "@chakra-ui/react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, FormState, ActionType, ActionIndicateurDeuxData } from "../../globals"

import calculIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux"
import { messageMesureCorrection } from "../../utils/helpers"
import { useTitle } from "../../utils/hooks"

import InfoBlock from "../../components/ds/InfoBlock"
import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import { ButtonSimulatorLink, TextSimulatorLink } from "../../components/SimulatorLink"

import IndicateurDeuxForm from "./IndicateurDeuxForm"
import IndicateurDeuxResult from "./IndicateurDeuxResult"

interface IndicateurDeuxProps extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Indicateur écart de taux d’augmentation individuelle hors promotion"

const IndicateurDeux: FunctionComponent<IndicateurDeuxProps> = ({ state, dispatch }) => {
  useTitle(title)

  const updateIndicateurDeux = useCallback(
    (data: ActionIndicateurDeuxData) => dispatch({ type: "updateIndicateurDeux", data }),
    [dispatch],
  )

  const validateIndicateurDeux = useCallback(
    (valid: FormState) => dispatch({ type: "validateIndicateurDeux", valid }),
    [dispatch],
  )

  const {
    effectifsIndicateurCalculable,
    effectifEtEcartAugmentParGroupe,
    indicateurCalculable,
    indicateurEcartAugmentation,
    indicateurSexeSurRepresente,
    noteIndicateurDeux,
    correctionMeasure,
  } = calculIndicateurDeux(state)

  // le formulaire d'effectif n'est pas validé
  if (state.effectif.formValidated !== "Valid") {
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
        <div>
          <InfoBlock
            type="warning"
            title="Malheureusement votre indicateur n’est pas calculable"
            text="L’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
          />
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur3" label="Suivant" />
          </ActionBar>
        </div>
      </PageIndicateurDeux>
    )
  }

  // formulaire indicateur validé mais données renseignées ne permettent pas de calculer l'indicateur
  if (state.indicateurDeux.formValidated === "Valid" && !indicateurCalculable) {
    return (
      <PageIndicateurDeux>
        <div>
          <InfoBlock
            type="warning"
            title="Malheureusement votre indicateur n’est pas calculable"
            text="Il n’y a pas eu d’augmentation individuelle durant la période de référence."
          />
          <ActionBar>
            <ActionLink onClick={() => validateIndicateurDeux("None")}>Modifier les données saisies</ActionLink>
          </ActionBar>
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur3" label="Suivant" />
          </ActionBar>
        </div>
      </PageIndicateurDeux>
    )
  }

  return (
    <PageIndicateurDeux>
      <LayoutFormAndResult
        childrenForm={
          <div>
            <IndicateurDeuxForm
              ecartAugmentParCategorieSocioPro={effectifEtEcartAugmentParGroupe}
              presenceAugmentation={state.indicateurDeux.presenceAugmentation}
              readOnly={state.indicateurDeux.formValidated === "Valid"}
              updateIndicateurDeux={updateIndicateurDeux}
              validateIndicateurDeux={validateIndicateurDeux}
            />
            {state.indicateurDeux.formValidated === "Valid" && correctionMeasure && (
              <Text fontSize="sm" color="gray.500" fontStyle="italic" mt={6}>
                {messageMesureCorrection(indicateurSexeSurRepresente, "d'augmentations", "20/20")}
              </Text>
            )}
          </div>
        }
        childrenResult={
          state.indicateurDeux.formValidated === "Valid" && (
            <IndicateurDeuxResult
              indicateurEcartAugmentation={indicateurEcartAugmentation}
              indicateurSexeSurRepresente={indicateurSexeSurRepresente}
              noteIndicateurDeux={noteIndicateurDeux}
              correctionMeasure={correctionMeasure}
              validateIndicateurDeux={validateIndicateurDeux}
            />
          )
        }
      />
    </PageIndicateurDeux>
  )
}

const PageIndicateurDeux = ({ children }: PropsWithChildren) => (
  <Page
    title={title}
    tagline="Le pourcentage de femmes et d’hommes ayant été augmentés durant la période de référence, doit être renseigné par CSP."
  >
    {children}
  </Page>
)

export default IndicateurDeux
