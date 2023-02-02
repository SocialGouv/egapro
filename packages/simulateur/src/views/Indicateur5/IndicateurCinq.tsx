import React, { FunctionComponent } from "react"

import { useTitle } from "../../utils/hooks"

import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import SimulateurPage from "../../components/SimulateurPage"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import IndicateurCinqForm from "./IndicateurCinqForm"
import IndicateurCinqResult from "./IndicateurCinqResult"

const title = "Indicateur hautes rémunérations"

const IndicateurCinq: FunctionComponent = () => {
  useTitle(title)

  const { state } = useAppStateContextProvider()

  if (!state) return null

  return (
    <SimulateurPage
      title="Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations"
      tagline="Renseignez le nombre de femmes et d'hommes parmi les 10 plus hautes rémunérations durant la période de référence."
    >
      <LayoutFormAndResult form={<IndicateurCinqForm />} result={<IndicateurCinqResult />} />
    </SimulateurPage>
  )
}

export default IndicateurCinq
