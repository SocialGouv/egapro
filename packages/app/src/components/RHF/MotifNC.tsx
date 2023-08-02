import Select from "@codegouvfr/react-dsfr/Select";
import { labelsMotifNC, type MotifNCKey, motifsNC } from "@services/form/declaration/DeclarationFormBuilder";
import { type PropsWithChildren } from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  stepName: MotifNCKey;
};

export const MotifNC = ({ stepName }: PropsWithChildren<Props>) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <Select
        label="Précision du motif de non calculabilité de l'indicateur"
        nativeSelectProps={{ ...register("motifNonCalculabilité") }}
        state={errors.motifNonCalculabilité ? "error" : "default"}
        stateRelatedMessage={errors.motifNonCalculabilité?.message as string | undefined}
      >
        <option value="" disabled hidden>
          Selectionnez une option
        </option>
        {motifsNC[stepName].map(motif => (
          <option key={motif} value={motif}>
            {labelsMotifNC[motif]}
          </option>
        ))}
      </Select>
    </>
  );
};