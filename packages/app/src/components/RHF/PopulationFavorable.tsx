import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { get } from "lodash";
import { useFormContext } from "react-hook-form";

type Props = {
  disabled?: boolean;
  legend?: string;
};

export const PopulationFavorable = ({ legend, disabled }: Props) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

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
            value: "hommes",
            ...register("populationFavorable"),
          },
        },
      ]}
      orientation="horizontal"
      // Error in RHF. The error is not detected in onChange validation, because the ref is not found.
      state={get(errors, "populationFavorable") && "error"}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      stateRelatedMessage={get(errors, "populationFavorable")?.message || ""}
    />
  );
};
