import React, { FunctionComponent } from "react"

import { useTitle } from "../../utils/hooks"

import LayoutForm from "../../components/LayoutForm"
import SimulateurPage from "../../components/SimulateurPage"
import InformationsDeclarantForm from "./InformationsDeclarantForm"

const title = "Informations déclarant"

const InformationsDeclarant: FunctionComponent = () => {
  useTitle(title)

  return (
    <SimulateurPage
      title={title}
      tagline="Renseignez le nom, le prénom et le numéro de téléphone du déclarant pour tout contact ultérieur par les services de l’inspection du travail."
    >
      <LayoutForm form={<InformationsDeclarantForm />} />
    </SimulateurPage>
  )
}

export default InformationsDeclarant
