import Select from "@codegouvfr/react-dsfr/Select";
import { labelsMotifNC, type MotifNCKey, motifsNC } from "@services/form/declaration/DeclarationFormBuilder";
import { type PropsWithChildren } from "react";
import { useController } from "react-hook-form";

type Props = {
  stepName: MotifNCKey;
};

export const MotifNC = ({ stepName }: PropsWithChildren<Props>) => {
  const {
    field,
    fieldState: { error },
  } = useController({
    name: "motifNonCalculabilité",
  });

  return (
    <>
      <Select
        label="Précision du motif de non calculabilité de l'indicateur"
        nativeSelectProps={{ ...field }}
        state={error ? "error" : "default"}
        stateRelatedMessage={error?.message}
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
