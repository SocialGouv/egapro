/** @jsx jsx */
import { jsx } from "@emotion/core"
import { useCallback, ReactNode } from "react"
import { RouteComponentProps } from "react-router-dom"

import { AppState, FormState, ActionType, ActionInformationsEntrepriseData } from "../../globals"

import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"

import InformationsEntrepriseForm from "./InformationsEntrepriseForm"

interface Props extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

function InformationsEntreprise({ state, dispatch }: Props) {
  const updateInformationsEntreprise = useCallback(
    (data: ActionInformationsEntrepriseData) => dispatch({ type: "updateInformationsEntreprise", data }),
    [dispatch],
  )

  const validateInformationsEntreprise = useCallback(
    (valid: FormState) => dispatch({ type: "validateInformationsEntreprise", valid }),
    [dispatch],
  )

  return (
    <PageInformationsEntreprise>
      <LayoutFormAndResult
        childrenForm={
          <InformationsEntrepriseForm
            informationsEntreprise={state.informationsEntreprise}
            readOnly={state.informationsEntreprise.formValidated === "Valid"}
            updateInformationsEntreprise={updateInformationsEntreprise}
            validateInformationsEntreprise={validateInformationsEntreprise}
          />
        }
        childrenResult={null}
      />
    </PageInformationsEntreprise>
  )
}

function PageInformationsEntreprise({ children }: { children: ReactNode }) {
  return (
    <Page
      title="Informations entreprise/UES"
      tagline={[
        "Renseignez le périmètre retenu pour le calcul de l'index (Entreprise ou UES), le numéro Siren de l'entreprise déclarante, ainsi que les informations concernant l'UES.",
        "Les informations relatives à l'entreprise (Raison sociale, Code NAF, Adresse complète) sont renseignées automatiquement et sont non modifiables (source : Répertoire Sirene de l'INSEE).",
      ]}
    >
      {children}
    </Page>
  )
}

export default InformationsEntreprise
