import React, { FunctionComponent, PropsWithChildren } from "react"

import { useTitle } from "../../utils/hooks"

import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import Page from "../../components/Page"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import IndicateurCinqForm from "./IndicateurCinqForm"
import IndicateurCinqResult from "./IndicateurCinqResult"

const title = "Indicateur hautes rémunérations"

const IndicateurCinq: FunctionComponent = () => {
  useTitle(title)

  const { state } = useAppStateContextProvider()

  if (!state) return null

  return (
    <PageIndicateurCinq>
      <LayoutFormAndResult form={<IndicateurCinqForm />} result={<IndicateurCinqResult />} />
    </PageIndicateurCinq>
  )
}

const PageIndicateurCinq = ({ children }: PropsWithChildren) => (
  <Page
    title="Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations"
    tagline="Renseignez le nombre de femmes et d'hommes parmi les 10 plus hautes rémunérations durant la période de référence."
  >
    {children}
  </Page>
)

export default IndicateurCinq
