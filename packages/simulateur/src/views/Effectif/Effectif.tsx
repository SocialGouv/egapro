import { ListItem, Text, UnorderedList, VStack } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"

import totalNombreSalaries from "../../utils/totalNombreSalaries"

import InfoBlock from "../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import SimulateurPage from "../../components/SimulateurPage"
import { TextSimulatorLink } from "../../components/SimulatorLink"
import { useAppStateContextProvider } from "../../hooks/useAppStateContextProvider"
import { isFormValid } from "../../utils/formHelpers"
import { useTitle } from "../../utils/hooks"
import EffectifForm from "./EffectifForm"
import EffectifResult from "./EffectifResult"

const title = "Effectifs pris en compte"

const Effectif: FunctionComponent = () => {
  useTitle(title)
  const { state, dispatch } = useAppStateContextProvider()

  if (!state) return null

  const {
    totalNombreSalariesHomme: totalNombreSalariesHommeCsp,
    totalNombreSalariesFemme: totalNombreSalariesFemmeCsp,
  } = totalNombreSalaries(state.effectif.nombreSalaries)
  const {
    totalNombreSalariesHomme: totalNombreSalariesHommeCoef,
    totalNombreSalariesFemme: totalNombreSalariesFemmeCoef,
  } = totalNombreSalaries(state.indicateurUn.coefficient)

  return (
    <SimulateurPage
      title="Indication des effectifs"
      tagline="Les effectifs pris en compte pour le calcul doivent être renseignés en effectif physique par catégorie socio-professionnelle (CSP) et tranche d’âge."
    >
      <VStack spacing={8} align="stretch">
        <LayoutFormAndResult
          form={<EffectifForm />}
          result={
            isFormValid(state.effectif) && (
              <EffectifResult
                totalNombreSalariesFemme={totalNombreSalariesFemmeCsp}
                totalNombreSalariesHomme={totalNombreSalariesHommeCsp}
                unsetEffectif={() => dispatch({ type: "unsetEffectif" })}
              />
            )
          }
        />
        <VStack spacing={6} align="stretch">
          {isFormValid(state.effectif) &&
            (state.indicateurUn.formValidated === "Invalid" ||
              (state.informations.trancheEffectifs !== "50 à 250" &&
                (state.indicateurDeux.formValidated === "Invalid" ||
                  state.indicateurTrois.formValidated === "Invalid")) ||
              (state.informations.trancheEffectifs === "50 à 250" &&
                state.indicateurDeuxTrois.formValidated === "Invalid")) && (
              <InfoBlock
                type="success"
                title="Vos effectifs ont été modifiés"
                text={
                  <>
                    <Text>
                      Afin de s'assurer de la cohérence de votre index, merci de vérifier les données de vos
                      indicateurs.
                    </Text>
                    <UnorderedList mt={2}>
                      {state.indicateurUn.formValidated === "Invalid" && (
                        <ListItem>
                          <TextSimulatorLink to="/indicateur1" label="Aller à l'indicateur écart de rémunérations" />
                        </ListItem>
                      )}
                      {state.informations.trancheEffectifs !== "50 à 250" &&
                        state.indicateurDeux.formValidated === "Invalid" && (
                          <ListItem>
                            <TextSimulatorLink
                              to="/indicateur2"
                              label="Aller à l'indicateur écart de taux d'augmentations"
                            />
                          </ListItem>
                        )}
                      {state.informations.trancheEffectifs !== "50 à 250" &&
                        state.indicateurTrois.formValidated === "Invalid" && (
                          <ListItem>
                            <TextSimulatorLink
                              to="/indicateur3"
                              label="Aller à l'indicateur écart de taux de promotions"
                            />
                          </ListItem>
                        )}
                      {state.informations.trancheEffectifs === "50 à 250" &&
                        state.indicateurDeuxTrois.formValidated === "Invalid" && (
                          <ListItem>
                            <TextSimulatorLink
                              to="/indicateur2et3"
                              label="Aller à l'indicateur écart de taux d'augmentations"
                            />
                          </ListItem>
                        )}
                    </UnorderedList>
                  </>
                }
              />
            )}
          {/* This should never happen, as modifying the effectif will invalidate the indicateur form */}
          {isFormValid(state.effectif) &&
            isFormValid(state.indicateurUn) &&
            state.indicateurUn.modaliteCalcul === "coef" &&
            (totalNombreSalariesHommeCoef !== totalNombreSalariesHommeCsp ||
              totalNombreSalariesFemmeCoef !== totalNombreSalariesFemmeCsp) && (
              <InfoBlock
                title="Attention"
                type="warning"
                text={
                  <>
                    <span>
                      Vos effectifs ne sont pas les mêmes que ceux déclarés en niveaux ou coefficients hiérarchiques.
                      &nbsp;
                    </span>
                    <TextSimulatorLink to="/indicateur1" label="Aller à l'indicateur écart de rémunérations" />
                  </>
                }
              />
            )}

          {isFormValid(state.informations) &&
            isFormValid(state.effectif) &&
            totalNombreSalariesHommeCsp + totalNombreSalariesFemmeCsp > 250 &&
            state.informations.trancheEffectifs === "50 à 250" && (
              <InfoBlock
                title="Attention"
                text="Les effectifs pris en compte pour le calcul sont supérieurs aux effectifs déclarés pour l'entreprise."
                type="warning"
              />
            )}
        </VStack>
      </VStack>
    </SimulateurPage>
  )
}

export default Effectif
