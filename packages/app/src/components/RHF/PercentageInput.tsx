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
    setValue,
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
          onBlur: e => {
            // It's OK to set no value at all.
            if (e.target.value === "") return setValue(name, null);

            // Round number to 1 decimal.
            const num = Number(e.target.value);

            if (isNaN(num)) return setValue(name, null);

            setValue(name, Math.round(num * 10) / 10);
          },
        }}
        state={get(errors, name) ? "error" : "default"}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        stateRelatedMessage={get(errors, name)?.message || ""}
      />
    </>
  );
};
