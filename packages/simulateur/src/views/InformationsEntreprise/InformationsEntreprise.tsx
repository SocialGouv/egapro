import React, { useCallback, PropsWithChildren } from "react"
import { RouteComponentProps, useParams } from "react-router-dom"

import { AppState, FormState, ActionType, ActionInformationsEntrepriseData } from "../../globals"

import { useTitle } from "../../utils/hooks"
import { useDeclaration } from "../../hooks/useDeclaration"

import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import InformationsEntrepriseForm from "./InformationsEntrepriseForm"

interface InformationsEntrepriseProps extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const PageInformationsEntreprise = ({ children }: PropsWithChildren) => {
  return (
    <Page
      title={title}
      tagline={[
        "Renseignez le périmètre retenu pour le calcul de l'index (Entreprise ou UES), le numéro Siren de l'entreprise déclarante, ainsi que les informations concernant l'UES.",
        "Les informations relatives à l'entreprise (Raison sociale, Code NAF, Adresse complète) sont renseignées automatiquement et sont non modifiables (source : Répertoire Sirene de l'INSEE).",
      ]}
    >
      {children}
    </Page>
  )
}

type Params = {
  code: string
}

const title = "Informations entreprise/UES"

const InformationsEntreprise = ({ state, dispatch }: InformationsEntrepriseProps) => {
  useTitle(title)
  const { code } = useParams<Params>()

  const updateInformationsEntreprise = useCallback(
    (data: ActionInformationsEntrepriseData) => dispatch({ type: "updateInformationsEntreprise", data }),
    [dispatch],
  )

  const validateInformationsEntreprise = useCallback(
    (valid: FormState) => dispatch({ type: "validateInformationsEntreprise", valid }),
    [dispatch],
  )

  const { declaration } = useDeclaration(state?.informationsEntreprise?.siren, state?.informations?.anneeDeclaration)

  const alreadyDeclared = declaration?.data?.id === code

  return (
    <PageInformationsEntreprise>
      <LayoutFormAndResult
        childrenForm={
          <InformationsEntrepriseForm
            state={state}
            update={updateInformationsEntreprise}
            validate={validateInformationsEntreprise}
            alreadyDeclared={alreadyDeclared}
          />
        }
        childrenResult={null}
      />
    </PageInformationsEntreprise>
  )
}

export default InformationsEntreprise
