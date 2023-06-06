import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { type PropsWithChildren } from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  legend: string;
  name: string;
};

export const RadioOuiNon = ({ legend, name }: PropsWithChildren<Props>) => {
  const { register } = useFormContext();

  return (
    <RadioButtons
      legend={legend}
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
