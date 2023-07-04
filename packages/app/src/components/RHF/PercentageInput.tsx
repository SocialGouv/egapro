import Input from "@codegouvfr/react-dsfr/Input";
import { get } from "lodash";
import { type PropsWithChildren } from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  disabled?: boolean;
  label?: string;
  max?: number;
  min?: number;
  name: string;
};

export const PercentageInput = ({ label, min, max, name, disabled }: PropsWithChildren<Props>) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <Input
        label={label}
        nativeInputProps={{
          type: "number",
          min,
          max,
          step: 0.1,
          ...register(name, {
            valueAsNumber: true,
            disabled,
          }),
        }}
        state={get(errors, name) ? "error" : "default"}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        stateRelatedMessage={get(errors, name)?.message || ""}
      />
    </>
  );
};
