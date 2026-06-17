"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Grid, GridCol } from "@design-system";

export const SelectSiren = ({
  sirenListWithCompanyName,
  currentSiren,
}: {
  currentSiren?: string;
  sirenListWithCompanyName: Array<{ companyName: string; siren: string }>;
}) => {
  const active = sirenListWithCompanyName.find(data => data.siren === currentSiren) ?? sirenListWithCompanyName[0];
  if (!active) return null;

  return (
    <Grid>
      <GridCol sm={3}>
        <p className={fr.cx("fr-text--bold", "fr-mb-0")}>Numéro Siren de l'entreprise</p>
        <p className={fr.cx("fr-mb-0")}>{active.siren}</p>
      </GridCol>
      <GridCol sm={9}>
        <div className={fr.cx("fr-pt-3v", "fr-pl-2v")}>
          <span className={fr.cx("fr-icon-building-line", "fr-pr-2v")} aria-hidden="true"></span>
          <span>{active.companyName}</span>
        </div>
      </GridCol>
    </Grid>
  );
};
