/** @jsx jsx */
import { jsx } from "@emotion/core";
import { useCallback } from "react";
import {
  FormState,
  ActionIndicateurUnCoefData,
  GroupTranchesAgesIndicateurUn
} from "../../../globals";

import { effectifEtEcartRemuGroupCoef } from "../../../utils/calculsEgaProIndicateurUn";

import LayoutFormAndResult from "../../../components/LayoutFormAndResult";
import { ButtonSimulatorLink } from "../../../components/SimulatorLink";

import IndicateurUnFormRaw from "../IndicateurUnFormRaw";
import IndicateurUnResult from "../IndicateurUnResult";

interface Props {
  ecartRemuParTrancheAge: Array<effectifEtEcartRemuGroupCoef>;
  readOnly: boolean;
  updateIndicateurUnCoef: (data: ActionIndicateurUnCoefData) => void;
  validateIndicateurUn: (valid: FormState) => void;
  indicateurEcartRemuneration: number | undefined;
  indicateurSexeSurRepresente: "hommes" | "femmes" | undefined;
  noteIndicateurUn: number | undefined;
}

function IndicateurUnCoefEffectifForm({
  ecartRemuParTrancheAge,
  readOnly,
  updateIndicateurUnCoef,
  validateIndicateurUn,
  indicateurEcartRemuneration,
  indicateurSexeSurRepresente,
  noteIndicateurUn
}: Props) {
  const updateIndicateurUnRaw = useCallback(
    (
      data: Array<{
        id: any;
        tranchesAges: Array<GroupTranchesAgesIndicateurUn>;
      }>
    ) => {
      const coefficient = data.map(({ id, tranchesAges }) => ({
        tranchesAges
      }));
      updateIndicateurUnCoef({ coefficient });
    },
    [updateIndicateurUnCoef]
  );

  return (
    <LayoutFormAndResult
      childrenForm={
        <IndicateurUnFormRaw
          ecartRemuParTrancheAge={ecartRemuParTrancheAge}
          readOnly={readOnly}
          updateIndicateurUn={updateIndicateurUnRaw}
          validateIndicateurUn={validateIndicateurUn}
          nextLink={<ButtonSimulatorLink to="/indicateur2" label="suivant" />}
        />
      }
      childrenResult={
        readOnly && (
          <IndicateurUnResult
            indicateurEcartRemuneration={indicateurEcartRemuneration}
            indicateurSexeSurRepresente={indicateurSexeSurRepresente}
            noteIndicateurUn={noteIndicateurUn}
            validateIndicateurUn={validateIndicateurUn}
          />
        )
      }
    />
  );
}

export default IndicateurUnCoefEffectifForm;
