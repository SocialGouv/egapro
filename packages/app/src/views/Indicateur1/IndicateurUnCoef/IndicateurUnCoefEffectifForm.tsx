/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useMemo, useCallback } from "react";
import {
  FormState,
  GroupeCoefficient,
  GroupTranchesAgesEffectif,
  ActionIndicateurUnCoefData
} from "../../../globals";

import LayoutFormAndResult from "../../../components/LayoutFormAndResult";
import ButtonAction from "../../../components/ButtonAction";
import InfoBloc from "../../../components/InfoBloc";
import ActionLink from "../../../components/ActionLink";

import EffectifFormRaw from "../../Effectif/EffectifFormRaw";
import EffectifResult from "../../Effectif/EffectifResult";

interface Props {
  coefficient: Array<GroupeCoefficient>;
  readOnly: boolean;
  updateIndicateurUnCoef: (data: ActionIndicateurUnCoefData) => void;
  validateIndicateurUnCoefEffectif: (valid: FormState) => void;
  coefficientGroupFormValidated: FormState;
  navigateToRemuneration: () => void;
  navigateToGroupe: () => void;
}

function IndicateurUnCoefEffectifForm({
  coefficient,
  readOnly,
  updateIndicateurUnCoef,
  validateIndicateurUnCoefEffectif,
  coefficientGroupFormValidated,
  navigateToRemuneration,
  navigateToGroupe
}: Props) {
  const effectifRaw = useMemo(
    () =>
      coefficient.map(({ name, tranchesAges }, index) => ({
        id: index,
        name,
        tranchesAges
      })),
    [coefficient]
  );

  const updateEffectifRaw = useCallback(
    (
      data: Array<{
        id: any;
        tranchesAges: Array<GroupTranchesAgesEffectif>;
      }>
    ) => {
      const coefficient = data.map(({ id, tranchesAges }) => ({
        tranchesAges
      }));
      updateIndicateurUnCoef({ coefficient });
    },
    [updateIndicateurUnCoef]
  );

  const { totalNbSalarieHomme, totalNbSalarieFemme } = coefficient.reduce(
    (acc, { tranchesAges }) => {
      const {
        totalGroupNbSalarieHomme,
        totalGroupNbSalarieFemme
      } = tranchesAges.reduce(
        (accGroup, { nombreSalariesHommes, nombreSalariesFemmes }) => {
          return {
            totalGroupNbSalarieHomme:
              accGroup.totalGroupNbSalarieHomme + (nombreSalariesHommes || 0),
            totalGroupNbSalarieFemme:
              accGroup.totalGroupNbSalarieFemme + (nombreSalariesFemmes || 0)
          };
        },
        { totalGroupNbSalarieHomme: 0, totalGroupNbSalarieFemme: 0 }
      );

      return {
        totalNbSalarieHomme: acc.totalNbSalarieHomme + totalGroupNbSalarieHomme,
        totalNbSalarieFemme: acc.totalNbSalarieFemme + totalGroupNbSalarieFemme
      };
    },
    { totalNbSalarieHomme: 0, totalNbSalarieFemme: 0 }
  );

  // le formulaire d'effectif n'est pas validé
  if (coefficientGroupFormValidated !== "Valid") {
    return (
      <InfoBloc
        title="vous devez renseignez vos groupes avant d’avoir accès à cet indicateur"
        text={
          <ActionLink onClick={navigateToGroupe}>
            renseigner les groupes
          </ActionLink>
        }
      />
    );
  }

  return (
    <LayoutFormAndResult
      childrenForm={
        <EffectifFormRaw
          effectifRaw={effectifRaw}
          readOnly={readOnly}
          updateEffectif={updateEffectifRaw}
          validateEffectif={validateIndicateurUnCoefEffectif}
          nextLink={
            <ButtonAction onClick={navigateToRemuneration} label="suivant" />
          }
        />
      }
      childrenResult={
        readOnly && (
          <EffectifResult
            totalNbSalarieFemme={totalNbSalarieFemme}
            totalNbSalarieHomme={totalNbSalarieHomme}
            validateEffectif={validateIndicateurUnCoefEffectif}
          />
        )
      }
    />
  );
}

export default IndicateurUnCoefEffectifForm;
