import React, { FunctionComponent, useMemo, useCallback } from "react"
import { Text } from "@chakra-ui/react"

import { AppState, FormState, GroupTranchesAgesEffectif, ActionIndicateurUnCoefData } from "../../../globals"
import totalNombreSalaries from "../../../utils/totalNombreSalaries"
import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import ButtonAction from "../../../components/ds/ButtonAction"
import InfoBlock from "../../../components/ds/InfoBlock"
import ActionLink from "../../../components/ActionLink"
import EffectifFormRaw, { getTotalNbSalarie } from "../../Effectif/EffectifFormRaw"
import EffectifResult from "../../Effectif/EffectifResult"

interface IndicateurUnCoefEffectifFormProps {
  state: AppState
  updateIndicateurUnCoef: (data: ActionIndicateurUnCoefData) => void
  validateIndicateurUnCoefEffectif: (valid: FormState) => void
  navigateToRemuneration: () => void
  navigateToGroupe: () => void
}

const IndicateurUnCoefEffectifForm: FunctionComponent<IndicateurUnCoefEffectifFormProps> = ({
  state,
  updateIndicateurUnCoef,
  validateIndicateurUnCoefEffectif,
  navigateToRemuneration,
  navigateToGroupe,
}) => {
  const { coefficient, coefficientGroupFormValidated, coefficientEffectifFormValidated, formValidated } =
    state.indicateurUn

  const effectifRaw = useMemo(
    () =>
      coefficient.map(({ name, tranchesAges }, index) => ({
        id: index,
        name,
        tranchesAges,
      })),
    [coefficient],
  )

  const updateEffectifRaw = useCallback(
    (
      data: Array<{
        id: any
        name: string
        tranchesAges: Array<GroupTranchesAgesEffectif>
      }>,
    ) => {
      const coefficient = data.map(({ tranchesAges }) => ({
        tranchesAges,
      }))
      updateIndicateurUnCoef({ coefficient })
    },
    [updateIndicateurUnCoef],
  )

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
        text={<ActionLink onClick={navigateToGroupe}>Renseigner les groupes</ActionLink>}
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
            validateEffectif={validateIndicateurUnCoefEffectif}
            nextLink={<ButtonAction onClick={navigateToRemuneration} label="Suivant" size={"lg"} />}
            formValidator={formValidator}
          />
        }
        childrenResult={
          readOnly && (
            <EffectifResult
              totalNombreSalariesFemme={totalNombreSalariesFemmeCoef}
              totalNombreSalariesHomme={totalNombreSalariesHommeCoef}
              validateEffectif={validateIndicateurUnCoefEffectif}
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
                  <ActionLink onClick={navigateToRemuneration}>Aller à l'étape 3 : rémunérations</ActionLink>
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
