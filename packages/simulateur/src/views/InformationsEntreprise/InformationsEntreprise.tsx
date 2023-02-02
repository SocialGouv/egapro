import React from "react"
import { useParams } from "react-router-dom"

import SimulateurPage from "../../components/SimulateurPage"
import { useTitle } from "../../utils/hooks"
import InformationsEntrepriseForm from "./InformationsEntrepriseForm"

type Params = {
  code: string
}

const title = "Informations entreprise/UES"

const InformationsEntreprise = () => {
  useTitle(title)
  const { code } = useParams<Params>()

  return (
    <SimulateurPage
      title={title}
      tagline={[
        "Renseignez le périmètre retenu pour le calcul de l'index (Entreprise ou UES), le numéro Siren de l'entreprise déclarante, ainsi que les informations concernant l'UES.",
        "Les informations relatives à l'entreprise (Raison sociale, Code NAF, Adresse complète) sont renseignées automatiquement et sont non modifiables (source : Répertoire Sirene de l'INSEE).",
      ]}
    >
      <InformationsEntrepriseForm code={code} />
    </SimulateurPage>
  )
}

export default InformationsEntreprise
