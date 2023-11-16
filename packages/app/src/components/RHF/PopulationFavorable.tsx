import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { FavorablePopulation } from "@common/core-domain/domain/valueObjects/declaration/indicators/FavorablePopulation";
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
          label: FavorablePopulation.Label[FavorablePopulation.Enum.WOMEN],
          nativeInputProps: {
            value: FavorablePopulation.Enum.WOMEN,
            ...register("populationFavorable"),
          },
        },
        {
          label: FavorablePopulation.Label[FavorablePopulation.Enum.MEN],
          nativeInputProps: {
            value: FavorablePopulation.Enum.MEN,
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
