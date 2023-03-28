import { Text } from "@chakra-ui/react"
import React, { FunctionComponent, useEffect } from "react"

import ActionLink from "../../../components/ActionLink"
import ButtonAction from "../../../components/ds/ButtonAction"
import InfoBlock from "../../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import { EffectifPourTrancheAge } from "../../../globals"
import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"
import totalNombreSalaries from "../../../utils/totalNombreSalaries"
import EffectifFormRaw, { getTotalNbSalarie } from "../../Effectif/EffectifFormRaw"
import EffectifResult from "../../Effectif/EffectifResult"
import { TabIndicateurUnCoef, useIndicateurUnCoefContext } from "./IndicateurUnCoef"

interface IndicateurUnCoefEffectifFormProps {
  navigateTo: (tab: TabIndicateurUnCoef) => void
}

const IndicateurUnCoefEffectifForm: FunctionComponent<IndicateurUnCoefEffectifFormProps> = ({ navigateTo }) => {
  const { state, dispatch } = useAppStateContextProvider()

  const { effectifsIndicateurCalculable } = useIndicateurUnCoefContext()

  useEffect(() => {
    // Si l'indicateur 1 devient non calculable, on considère que l'ensemble du formulaire 1 est valide pour avoir une UI correcte (coche verte, etc.)
    if (state?.indicateurUn?.coefficientEffectifFormValidated === "Valid" && effectifsIndicateurCalculable === false)
      dispatch({ type: "validateIndicateurUn", valid: "Valid" })
  }, [effectifsIndicateurCalculable, dispatch, state?.indicateurUn?.coefficientEffectifFormValidated])

  if (!state) return null

  const { coefficient, coefficientGroupFormValidated, coefficientEffectifFormValidated, formValidated } =
    state.indicateurUn

  const effectifRaw = coefficient.map(({ name, tranchesAges }, index) => ({
    id: index,
    name,
    tranchesAges,
  }))

  const updateEffectifRaw = (
    data: Array<{
      id: any
      name: string
      tranchesAges: Array<EffectifPourTrancheAge>
    }>,
  ) => {
    const coefficient = data.map(({ tranchesAges }) => ({
      tranchesAges,
    }))
    dispatch({ type: "updateIndicateurUnCoef", data: { coefficient } })
  }

  const {
    totalNombreSalariesHomme: totalNombreSalariesHommeCoef,
    totalNombreSalariesFemme: totalNombreSalariesFemmeCoef,
  } = totalNombreSalaries(coefficient)
  const {
    totalNombreSalariesHomme: totalNombreSalariesHommeCsp,
    totalNombreSalariesFemme: totalNombreSalariesFemmeCsp,
  } = totalNombreSalaries(state.effectif.nombreSalaries)

  // le formulaire d'effectif n'est pas validé
  if (coefficientGroupFormValidated !== "Valid") {
    return (
      <InfoBlock
        title="Vous devez renseignez vos groupes avant d’avoir accès à cet indicateur"
        text={<ActionLink onClick={() => navigateTo("Groupe")}>Renseigner les groupes</ActionLink>}
      />
    )
  }

  const readOnly = coefficientEffectifFormValidated === "Valid"

  const formValidator = ({ effectif }: any) => {
    const { totalNbSalarieHomme: totalNombreSalariesHommeCoef, totalNbSalarieFemme: totalNombreSalariesFemmeCoef } =
      getTotalNbSalarie(effectif)
    return totalNombreSalariesHommeCoef !== totalNombreSalariesHommeCsp ||
      totalNombreSalariesFemmeCoef !== totalNombreSalariesFemmeCsp
      ? "Attention, vos effectifs ne sont pas les mêmes que ceux déclarés en catégories socio-professionnelles"
      : undefined
  }

  return (
    <>
      <LayoutFormAndResult
        form={
          <EffectifFormRaw
            effectifRaw={effectifRaw}
            readOnly={readOnly}
            updateEffectif={updateEffectifRaw}
            validateEffectif={(valid) => dispatch({ type: "validateIndicateurUnCoefEffectif", valid })}
            nextLink={
              <ButtonAction
                variant="outline"
                onClick={() => navigateTo("Remuneration")}
                label="Aller à Rémunérations"
                size="md"
              />
            }
            formValidator={formValidator}
          />
        }
        result={
          readOnly && (
            <EffectifResult
              totalNombreSalariesFemme={totalNombreSalariesFemmeCoef}
              totalNombreSalariesHomme={totalNombreSalariesHommeCoef}
              validateEffectif={(valid) => dispatch({ type: "validateIndicateurUnCoefEffectif", valid })}
            />
          )
        }
      />

      {readOnly && formValidated === "Invalid" && (
        <InfoBlock
          mt={4}
          title="Vos effectifs ont été modifiés"
          type="success"
          text={
            <>
              <Text>
                Afin de s'assurer de la cohérence de votre indicateur, merci de vérifier les données de vos étapes.
              </Text>
              <Text mt={1}>
                <ActionLink onClick={() => navigateTo("Remuneration")}>Aller à l'étape 3 : rémunérations</ActionLink>
              </Text>
            </>
          }
        />
      )}
    </>
  )
}

export default IndicateurUnCoefEffectifForm
