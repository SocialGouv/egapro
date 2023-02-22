import { Box } from "@chakra-ui/react"
import React from "react"

import { useTitle } from "../../utils/hooks"

import InfoBlock from "../../components/ds/InfoBlock"
import LayoutForm from "../../components/LayoutForm"
import SimulateurPage from "../../components/SimulateurPage"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFormValid } from "../../utils/formHelpers"
import InformationsSimulationForm from "./InformationsSimulationForm"

const title = "Informations calcul et période de référence"

const InformationsSimulation = () => {
  useTitle(title)
  const { state } = useAppStateContextProvider()
  if (!state) return null

  return (
    <SimulateurPage
      title={title}
      tagline="Renseignez la tranche d'effectifs assujettis de votre entreprise ou unité économique et sociale (UES), l'année au titre de laquelle les indicateurs sont calculés ainsi que la date de fin de la période de référence."
    >
      <LayoutForm form={<InformationsSimulationForm />} />

      {isFormValid(state.informations) &&
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
    </SimulateurPage>
  )
}

export default InformationsSimulation
