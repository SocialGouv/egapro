import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { type PropsWithChildren } from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  disabled?: boolean;
  legend: string;
  name: string;
};

export const RadioOuiNon = ({ legend, name, disabled }: PropsWithChildren<Props>) => {
  const { register } = useFormContext();

  disabled = disabled || false;

  return (
    <RadioButtons
      legend={legend}
      disabled={disabled}
      options={[
        {
          label: "Oui",
          nativeInputProps: {
            value: "oui",
            ...register(name),
          },
        },
        {
          label: "Non",
          nativeInputProps: {
            value: "non",
            ...register(name),
          },
        },
      ]}
      orientation="horizontal"
    />
  );
};
