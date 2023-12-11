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

  const field = register(name);

  return (
    <RadioButtons
      legend={legend}
      disabled={disabled}
      options={[
        {
          label: "Oui",
          nativeInputProps: {
            value: "oui",
            ...field,
            onChange: e => {
              field.onChange(e); // Inform RHF to update its state.
              if (triggerValidation) {
                trigger(); // Rerun validation to set isValid and errors.
              }
            },
          },
        },
        {
          label: "Non",
          nativeInputProps: {
            value: "non",
            ...field,
            onChange: e => {
              field.onChange(e); // Inform RHF to update its state.
              if (triggerValidation) {
                trigger(); // Rerun validation to set isValid and errors.
              }
            },
          },
        },
      ]}
      orientation="horizontal"
    />
  );
};
