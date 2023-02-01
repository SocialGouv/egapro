import React, { PropsWithChildren } from "react"
import { useParams } from "react-router-dom"

import Page from "../../components/Page"
import { useTitle } from "../../utils/hooks"
import InformationsEntrepriseForm from "./InformationsEntrepriseForm"

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

const InformationsEntreprise = () => {
  useTitle(title)
  const { code } = useParams<Params>()

  return (
    <PageInformationsEntreprise>
      <InformationsEntrepriseForm code={code} />
    </PageInformationsEntreprise>
  )
}

export default InformationsEntreprise
