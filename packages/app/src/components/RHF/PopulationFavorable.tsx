import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { useFormContext } from "react-hook-form";

type Props = {
  disabled?: boolean;
  legend?: string;
};

export const PopulationFavorable = ({ legend, disabled }: Props) => {
  const { register } = useFormContext();

  return (
    <RadioButtons
      legend={legend || "Population envers laquelle l'écart est favorable"}
      disabled={disabled}
      options={[
        {
          label: "Femmes",
          nativeInputProps: {
            value: "femmes",
            ...register("populationFavorable"),
          },
        },
        {
          label: "Hommes",
          nativeInputProps: {
            value: "homme",
            ...register("populationFavorable"),
          },
        },
      ]}
      orientation="horizontal"
    />
  );
};
