/** @jsx jsx */
import { jsx } from "@emotion/react"
import { Fragment, useMemo, useCallback } from "react"
import { AppState, FormState, GroupTranchesAgesEffectif, ActionIndicateurUnCoefData } from "../../../globals"
import totalNombreSalaries from "../../../utils/totalNombreSalaries"

import LayoutFormAndResult from "../../../components/LayoutFormAndResult"
import ButtonAction from "../../../components/ButtonAction"
import InfoBloc from "../../../components/InfoBloc"
import ActionLink from "../../../components/ActionLink"

import EffectifFormRaw, { getTotalNbSalarie } from "../../Effectif/EffectifFormRaw"
import EffectifResult from "../../Effectif/EffectifResult"

interface Props {
  state: AppState
  updateIndicateurUnCoef: (data: ActionIndicateurUnCoefData) => void
  validateIndicateurUnCoefEffectif: (valid: FormState) => void
  navigateToRemuneration: () => void
  navigateToGroupe: () => void
}

function IndicateurUnCoefEffectifForm({
  state,
  updateIndicateurUnCoef,
  validateIndicateurUnCoefEffectif,
  navigateToRemuneration,
  navigateToGroupe,
}: Props) {
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
      <InfoBloc
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
    <Fragment>
      <LayoutFormAndResult
        childrenForm={
          <EffectifFormRaw
            effectifRaw={effectifRaw}
            readOnly={readOnly}
            updateEffectif={updateEffectifRaw}
            validateEffectif={validateIndicateurUnCoefEffectif}
            nextLink={<ButtonAction onClick={navigateToRemuneration} label="suivant" />}
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
        <InfoBloc
          title="Vos effectifs ont été modifiés"
          type="success"
          text={
            <Fragment>
              <span>
                Afin de s'assurer de la cohérence de votre indicateur, merci de vérifier les données de vos étapes.
              </span>
              <br />
              <span>
                {formValidated === "Invalid" && (
                  <Fragment>
                    <ActionLink onClick={navigateToRemuneration}>aller à l'étape 3 : rémunérations</ActionLink>
                    &emsp;
                  </Fragment>
                )}
              </span>
            </Fragment>
          }
        />
      )}
    </Fragment>
  )
}

export default IndicateurUnCoefEffectifForm
