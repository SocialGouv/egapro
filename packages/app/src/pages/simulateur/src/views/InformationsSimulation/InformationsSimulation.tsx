import React, { useCallback, ReactNode, FunctionComponent } from "react"
import { useParams } from "react-router-dom"
import { Box } from "@chakra-ui/react"

import { AppState, FormState, ActionType, ActionInformationsSimulationData } from "../../globals"

import { useTitle } from "../../utils/hooks"
import { useDeclaration } from "../../hooks/useDeclaration"

import InfoBlock from "../../components/ds/InfoBlock"
import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import InformationsSimulationForm from "./InformationsSimulationForm"

interface InformationsSimulationProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

type Params = {
  code: string
}

const title = "Informations calcul et période de référence"

const InformationsSimulation: FunctionComponent<InformationsSimulationProps> = ({ state, dispatch }) => {
  useTitle(title)
  const { code } = useParams<Params>()

  const updateInformationsSimulation = useCallback(
    (data: ActionInformationsSimulationData) => dispatch({ type: "updateInformationsSimulation", data }),
    [dispatch],
  )

  const validateInformationsSimulation = useCallback(
    (valid: FormState) => dispatch({ type: "validateInformationsSimulation", valid }),
    [dispatch],
  )

  const { declaration } = useDeclaration(state?.informationsEntreprise?.siren, state?.informations?.anneeDeclaration)

  const alreadyDeclared = declaration?.data?.id === code

  return (
    <PageInformationsSimulation>
      <LayoutFormAndResult
        childrenForm={
          <InformationsSimulationForm
            informations={state.informations}
            readOnly={state.informations.formValidated === "Valid"}
            updateInformationsSimulation={updateInformationsSimulation}
            validateInformationsSimulation={validateInformationsSimulation}
            alreadyDeclared={alreadyDeclared}
          />
        }
        childrenResult={null}
      />

      {state.informations.formValidated === "Valid" &&
        (state.effectif.formValidated === "Invalid" ||
          state.indicateurUn.formValidated === "Invalid" ||
          (state.informations.trancheEffectifs !== "50 à 250" &&
            (state.indicateurDeux.formValidated === "Invalid" || state.indicateurTrois.formValidated === "Invalid")) ||
          (state.informations.trancheEffectifs === "50 à 250" &&
            state.indicateurDeuxTrois.formValidated === "Invalid") ||
          state.indicateurQuatre.formValidated === "Invalid" ||
          state.indicateurCinq.formValidated === "Invalid") && (
          <Box mt={6}>
            <InfoBlock
              title="Vos informations ont été modifiées"
              type="success"
              text="Afin de s'assurer de la cohérence de votre index, merci de vérifier les données de vos indicateurs."
            />
          </Box>
        )}
    </PageInformationsSimulation>
  )
}

function PageInformationsSimulation({ children }: { children: ReactNode }) {
  return (
    <Page
      title={title}
      tagline="Renseignez la tranche d'effectifs assujettis de votre entreprise ou unité économique et sociale (UES), l'année au titre de laquelle les indicateurs sont calculés ainsi que la date de fin de la période de référence."
    >
      {children}
    </Page>
  )
}

export default InformationsSimulation
