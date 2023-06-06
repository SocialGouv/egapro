import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { FormLayout } from "@design-system";

export const EffectifsForm = () => {
  return (
    <form noValidate>
      <FormLayout>
        <RadioButtons
          legend="Tranche d'effectifs assujettis de l'entreprise ou de l'unité économique et sociale (UES)"
          options={[
            {
              label: "De 50 à 250 inclus",
              nativeInputProps: {},
            },
            {
              label: "De 251 à 999 inclus",
              nativeInputProps: {},
            },
            {
              label: "De 1000 à plus",
              nativeInputProps: {},
            },
          ]}
        />
      </FormLayout>
    </form>
  );
};
