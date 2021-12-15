/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { useCallback, ReactNode } from "react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, FormState, ActionType, ActionIndicateurDeuxData } from "../../globals"

import calculIndicateurDeux from "../../utils/calculsEgaProIndicateurDeux"

import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import InfoBloc from "../../components/ds/InfoBloc"
import ActionBar from "../../components/ActionBar"
import ActionLink from "../../components/ActionLink"
import { ButtonSimulatorLink, TextSimulatorLink } from "../../components/SimulatorLink"

import IndicateurDeuxForm from "./IndicateurDeuxForm"
import IndicateurDeuxResult from "./IndicateurDeuxResult"

import { messageMesureCorrection } from "../../utils/helpers"
import { useTitle } from "../../utils/hooks"

interface Props extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Indicateur écart de taux d’augmentation individuelle hors promotion"

function IndicateurDeux({ state, dispatch }: Props) {
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
        <InfoBloc
          type="warning"
          title="Vous devez renseignez vos effectifs avant d’avoir accès à cet indicateur"
          text={<TextSimulatorLink to="/effectifs" label="Renseigner les effectifs" />}
        />
      </PageIndicateurDeux>
    )
  }

  // les effectifs ne permettent pas de calculer l'indicateur
  if (!effectifsIndicateurCalculable) {
    return (
      <PageIndicateurDeux>
        <div>
          <InfoBloc
            type="warning"
            title="Malheureusement votre indicateur n’est pas calculable"
            text="L’ensemble des groupes valables (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs."
          />
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur3" label="suivant" />
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
          <InfoBloc
            type="warning"
            title="Malheureusement votre indicateur n’est pas calculable"
            text="Il n’y a pas eu d’augmentation individuelle durant la période de référence."
          />
          <ActionBar>
            <ActionLink onClick={() => validateIndicateurDeux("None")}>modifier les données saisies</ActionLink>
          </ActionBar>
          <ActionBar>
            <ButtonSimulatorLink to="/indicateur3" label="suivant" />
          </ActionBar>
        </div>
      </PageIndicateurDeux>
    )
  }

  return (
    <PageIndicateurDeux>
      <LayoutFormAndResult
        childrenForm={
          <IndicateurDeuxForm
            ecartAugmentParCategorieSocioPro={effectifEtEcartAugmentParGroupe}
            presenceAugmentation={state.indicateurDeux.presenceAugmentation}
            readOnly={state.indicateurDeux.formValidated === "Valid"}
            updateIndicateurDeux={updateIndicateurDeux}
            validateIndicateurDeux={validateIndicateurDeux}
          />
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
      {state.indicateurDeux.formValidated === "Valid" && correctionMeasure && (
        <div css={styles.additionalInfo}>
          <p>{messageMesureCorrection(indicateurSexeSurRepresente, "d'augmentations", "20/20")}</p>
        </div>
      )}
    </PageIndicateurDeux>
  )
}

function PageIndicateurDeux({ children }: { children: ReactNode }) {
  return (
    <Page
      title={title}
      tagline="Le pourcentage de femmes et d’hommes ayant été augmentés durant la période de référence, doit être renseigné par CSP."
    >
      {children}
    </Page>
  )
}

const styles = {
  additionalInfo: css({
    color: "#61676F",
    fontSize: 14,
    fontStyle: "italic",
    maxWidth: 500,
    "& > p": {
      marginBottom: 30,
    },
  }),
}

export default IndicateurDeux
