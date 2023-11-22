import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { type PropsWithChildren } from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  disabled?: boolean;
  legend: string;
  name: string;
  triggerValidation?: boolean;
};

export const RadioOuiNon = ({ legend, name, disabled, triggerValidation = false }: PropsWithChildren<Props>) => {
  const { register, trigger } = useFormContext();

  disabled = disabled || false;

  const fieldMethods = register(name);

  return (
    <RadioButtons
      legend={legend}
      disabled={disabled}
      options={[
        {
          label: "Oui",
          nativeInputProps: {
            value: "oui",
            ...fieldMethods,
            onChange: e => {
              if (triggerValidation) {
                trigger(); // Rerun validation to set isValid.
              }
              fieldMethods.onChange(e); // Inform RHF to update its state.
            },
          },
        },
        {
          label: "Non",
          nativeInputProps: {
            value: "non",
            ...register(name),
            onChange: e => {
              if (triggerValidation) {
                trigger(); // Rerun validation to set isValid.
              }
              fieldMethods.onChange(e); // Inform RHF to update its state.
            },
          },
        },
      ]}
      orientation="horizontal"
    />
  );
};
