import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { type PropsWithChildren } from "react";

type Props = {};

export const EntrepriseUESForm = (props: PropsWithChildren<Props>) => {
  return (
    <form>
      <RadioButtons
        legend="Vous déclarez votre index en tant que :"
        name="type"
        options={[
          {
            label: "Entreprise",
            nativeInputProps: {
              value: "entreprise",
            },
          },
          {
            label: "Unité Économique et Sociale (UES)",
            nativeInputProps: {
              value: "ues",
            },
          },
        ]}
        orientation="horizontal"
      />

      <RadioButtons
        legend="Tranche d'effectifs assujettis de l'entreprise"
        name="tranche"
        options={[
          {
            label: "De 50 à 250 inclus",
            nativeInputProps: {
              value: "50:250",
            },
          },
          {
            label: "De 251 à 999 inclus",
            nativeInputProps: {
              value: "251:999",
            },
          },
          {
            label: "De 1000 à plus",
            nativeInputProps: {
              value: "1000:",
            },
          },
        ]}
      />
      <div style={{ display: "flex", gap: 10 }} className={fr.cx("fr-mt-4w")}>
        <Button type="reset" priority="secondary">
          Réinitialiser
        </Button>
        <Button>Suivant</Button>
      </div>
    </form>
  );
};
