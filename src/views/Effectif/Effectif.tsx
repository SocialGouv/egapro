/** @jsx jsx */
import { jsx } from "@emotion/react"
import { Fragment, useCallback } from "react"
import { RouteComponentProps } from "react-router-dom"
import { AppState, ActionType, FormState, ActionEffectifData } from "../../globals"
import totalNombreSalaries from "../../utils/totalNombreSalaries"

import Page from "../../components/Page"
import LayoutFormAndResult from "../../components/LayoutFormAndResult"
import InfoBlock from "../../components/ds/InfoBlock"
import { TextSimulatorLink } from "../../components/SimulatorLink"

import EffectifForm from "./EffectifForm"
import EffectifResult from "./EffectifResult"
import { useTitle } from "../../utils/hooks"

interface Props extends RouteComponentProps {
  state: AppState
  dispatch: (action: ActionType) => void
}

const title = "Effectifs pris en compte"

function Effectif({ state, dispatch }: Props) {
  useTitle(title)

  const updateEffectif = useCallback(
    (data: ActionEffectifData) => dispatch({ type: "updateEffectif", data }),
    [dispatch],
  )

  const validateEffectif = useCallback((valid: FormState) => dispatch({ type: "validateEffectif", valid }), [dispatch])

  const {
    totalNombreSalariesHomme: totalNombreSalariesHommeCsp,
    totalNombreSalariesFemme: totalNombreSalariesFemmeCsp,
  } = totalNombreSalaries(state.effectif.nombreSalaries)
  const {
    totalNombreSalariesHomme: totalNombreSalariesHommeCoef,
    totalNombreSalariesFemme: totalNombreSalariesFemmeCoef,
  } = totalNombreSalaries(state.indicateurUn.coefficient)

  return (
    <Page
      title="Indication des effectifs"
      tagline="Les effectifs pris en compte pour le calcul doivent être renseignés en effectif physique par catégorie socio-professionnelle (CSP) et tranche d’âge."
    >
      <LayoutFormAndResult
        childrenForm={
          <EffectifForm
            effectif={state.effectif}
            readOnly={state.effectif.formValidated === "Valid"}
            updateEffectif={updateEffectif}
            validateEffectif={validateEffectif}
          />
        }
        childrenResult={
          state.effectif.formValidated === "Valid" && (
            <EffectifResult
              totalNombreSalariesFemme={totalNombreSalariesFemmeCsp}
              totalNombreSalariesHomme={totalNombreSalariesHommeCsp}
              validateEffectif={validateEffectif}
            />
          )
        }
      />

      {state.effectif.formValidated === "Valid" &&
        (state.indicateurUn.formValidated === "Invalid" ||
          (state.informations.trancheEffectifs !== "50 à 250" &&
            (state.indicateurDeux.formValidated === "Invalid" || state.indicateurTrois.formValidated === "Invalid")) ||
          (state.informations.trancheEffectifs === "50 à 250" &&
            state.indicateurDeuxTrois.formValidated === "Invalid")) && (
          <InfoBlock
            type="success"
            title="Vos effectifs ont été modifiés"
            text={
              <Fragment>
                <span>
                  Afin de s'assurer de la cohérence de votre index, merci de vérifier les données de vos indicateurs.
                </span>
                &emsp;
                <span>
                  {state.indicateurUn.formValidated === "Invalid" && (
                    <Fragment>
                      <TextSimulatorLink to="/indicateur1" label="Aller à l'indicateur écart de rémunérations" />
                      &emsp;
                    </Fragment>
                  )}
                  {state.informations.trancheEffectifs !== "50 à 250" &&
                    state.indicateurDeux.formValidated === "Invalid" && (
                      <Fragment>
                        <TextSimulatorLink
                          to="/indicateur2"
                          label="Aller à l'indicateur écart de taux d'augmentations"
                        />
                        &emsp;
                      </Fragment>
                    )}
                  {state.informations.trancheEffectifs !== "50 à 250" &&
                    state.indicateurTrois.formValidated === "Invalid" && (
                      <Fragment>
                        <TextSimulatorLink to="/indicateur3" label="Aller à l'indicateur écart de taux de promotions" />
                        &emsp;
                      </Fragment>
                    )}
                  {state.informations.trancheEffectifs === "50 à 250" &&
                    state.indicateurDeuxTrois.formValidated === "Invalid" && (
                      <TextSimulatorLink
                        to="/indicateur2et3"
                        label="Aller à l'indicateur écart de taux d'augmentations"
                      />
                    )}
                </span>
              </Fragment>
            }
          />
        )}
      {/* This should never happen, as modifying the effectif will invalidate the indicateur form */}
      {state.effectif.formValidated === "Valid" &&
        state.indicateurUn.formValidated === "Valid" &&
        state.indicateurUn.coef &&
        (totalNombreSalariesHommeCoef !== totalNombreSalariesHommeCsp ||
          totalNombreSalariesFemmeCoef !== totalNombreSalariesFemmeCsp) && (
          <InfoBlock
            title="Attention"
            type="warning"
            text={
              <Fragment>
                <span>
                  Vos effectifs ne sont pas les mêmes que ceux déclarés en niveaux ou coefficients hiérarchiques. &emsp;
                </span>
                <TextSimulatorLink to="/indicateur1" label="Aller à l'indicateur écart de rémunérations" />
                &emsp;
              </Fragment>
            }
          />
        )}

      {state.informations.formValidated === "Valid" &&
        state.effectif.formValidated === "Valid" &&
        totalNombreSalariesHommeCsp + totalNombreSalariesFemmeCsp > 250 &&
        state.informations.trancheEffectifs === "50 à 250" && (
          <InfoBlock
            title="Attention, les effectifs pris en compte pour le calcul sont supérieurs aux effectifs déclarés pour l'entreprise"
            type="warning"
          />
        )}
    </Page>
  )
}

export default Effectif
