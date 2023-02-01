import React, { FunctionComponent, PropsWithChildren } from "react"

import { useTitle } from "../../utils/hooks"

import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import Page from "../../components/Page"
import InformationsDeclarantForm from "./InformationsDeclarantForm"

const title = "Informations déclarant"

const InformationsDeclarant: FunctionComponent = () => {
  useTitle(title)

  return (
    <PageInformationsDeclarant>
      <LayoutFormAndResult form={<InformationsDeclarantForm />} />
    </PageInformationsDeclarant>
  )
}

const PageInformationsDeclarant = ({ children }: PropsWithChildren) => (
  <Page
    title={title}
    tagline="Renseignez le nom, le prénom et le numéro de téléphone du déclarant pour tout contact ultérieur par les services de l’inspection du travail."
  >
    {children}
  </Page>
)

export default InformationsDeclarant
