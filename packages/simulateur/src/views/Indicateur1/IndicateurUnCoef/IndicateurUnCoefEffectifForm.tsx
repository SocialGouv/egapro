import { Text } from "@chakra-ui/react"
import React, { FunctionComponent } from "react"

import ActionLink from "../../../components/ActionLink"
import ButtonAction from "../../../components/ds/ButtonAction"
import InfoBlock from "../../../components/ds/InfoBlock"
import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import { GroupTranchesAgesEffectif } from "../../../globals"
import { useAppStateContextProvider } from "../../../hooks/useAppStateContextProvider"
import totalNombreSalaries from "../../../utils/totalNombreSalaries"
import EffectifFormRaw, { getTotalNbSalarie } from "../../Effectif/EffectifFormRaw"
import EffectifResult from "../../Effectif/EffectifResult"
import { TabIndicateurUnCoef } from "./IndicateurUnCoef"

interface IndicateurUnCoefEffectifFormProps {
  navigateTo: (tab: TabIndicateurUnCoef) => void
}

const IndicateurUnCoefEffectifForm: FunctionComponent<IndicateurUnCoefEffectifFormProps> = ({ navigateTo }) => {
  const { state, dispatch } = useAppStateContextProvider()

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
      tranchesAges: Array<GroupTranchesAgesEffectif>
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
        childrenForm={
          <EffectifFormRaw
            effectifRaw={effectifRaw}
            readOnly={readOnly}
            updateEffectif={updateEffectifRaw}
            validateEffectif={(valid) => dispatch({ type: "validateIndicateurUnCoefEffectif", valid })}
            nextLink={<ButtonAction onClick={() => navigateTo("Remuneration")} label="Suivant" size={"lg"} />}
            formValidator={formValidator}
          />
        }
        childrenResult={
          readOnly && (
            <EffectifResult
              totalNombreSalariesFemme={totalNombreSalariesFemmeCoef}
              totalNombreSalariesHomme={totalNombreSalariesHommeCoef}
              validateEffectif={(valid) => dispatch({ type: "validateIndicateurUnCoefEffectif", valid })}
            />
          )
        }
      />

      {coefficientEffectifFormValidated === "Valid" && formValidated === "Invalid" && (
        <InfoBlock
          mt={4}
          title="Vos effectifs ont été modifiés"
          type="success"
          text={
            <>
              <Text>
                Afin de s'assurer de la cohérence de votre indicateur, merci de vérifier les données de vos étapes.
              </Text>
              {formValidated === "Invalid" && (
                <Text mt={1}>
                  <ActionLink onClick={() => navigateTo("Remuneration")}>Aller à l'étape 3 : rémunérations</ActionLink>
                </Text>
              )}
            </>
          }
        />
      )}
    </>
  )
}

export default IndicateurUnCoefEffectifForm
