import Select from "@codegouvfr/react-dsfr/Select";
import { NotComputableReasonMaternityLeaves } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMaternityLeaves";
import { NotComputableReasonPromotions } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonPromotions";
import { NotComputableReasonRemunerations } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonRemunerations";
import { NotComputableReasonSalaryRaises } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonSalaryRaises";
import { NotComputableReasonSalaryRaisesAndPromotions } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonSalaryRaisesAndPromotions";
import { type IndicatorKeyWithNC } from "@common/core-domain/dtos/DeclarationDTO";
import { type PropsWithChildren } from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  stepName: IndicatorKeyWithNC;
};

const mapping: Record<IndicatorKeyWithNC, Record<string, string>> = {
  augmentations: NotComputableReasonSalaryRaises.Label,
  remunerations: NotComputableReasonRemunerations.Label,
  promotions: NotComputableReasonPromotions.Label,
  "augmentations-et-promotions": NotComputableReasonSalaryRaisesAndPromotions.Label,
  "conges-maternite": NotComputableReasonMaternityLeaves.Label,
} as const;

export const MotifNC = ({ stepName }: PropsWithChildren<Props>) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <Select
        label="Motif de non calculabilité de l'indicateur *"
        nativeSelectProps={{ ...register("motifNonCalculabilité") }}
        state={errors.motifNonCalculabilité && "error"}
        stateRelatedMessage={errors.motifNonCalculabilité?.message as string | undefined}
      >
        <option value="" hidden>
          Selectionnez un motif
        </option>
        {Object.entries(mapping[stepName]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
    </>
  );
};
